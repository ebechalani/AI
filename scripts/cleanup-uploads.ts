// Scheduled maintenance (ARCHITECTURE.md 5.2, 12), idempotent: deletes the uploaded objects
// that were never registered, the registered submission files that were never attached, both
// after 24 hours, and the rate-limit buckets whose window has passed.
//
//   npm run cleanup:uploads -- [--dry-run] [--max-age-hours 24] [--allow-project <id>] [--yes]

import { Timestamp } from 'firebase-admin/firestore';
import { getAdminBucket, getAdminDb } from '@/lib/firebase/admin';
import { collections } from '@/lib/firebase/collections';
import { deleteObject } from '@/lib/firebase/storage-admin';
import { FILE_ID_PATTERN } from '@/lib/limits';
import {
  COMMON_USAGE,
  connect,
  parseScriptArgs,
  runScript,
  ScriptError,
  step,
  targetOptions,
} from './lib/admin';
import { deleteMatching } from './lib/firestore';

const USAGE = `Usage: npm run cleanup:uploads -- [options]

Deletes unregistered objects, unattached submission files (both older than the maximum age)
and expired rate-limit buckets.

  --dry-run              report what would be deleted and delete nothing
  --max-age-hours <n>    minimum age of an object or file record to be deleted (default 24)
${COMMON_USAGE}`;

const DEFAULT_MAX_AGE_HOURS = 24;
const LIST_PAGE = 500;
const READ_CHUNK = 300;

/** The upload prefixes of storage.rules and where the file id sits in each path. */
const PREFIXES: readonly { prefix: string; fileIdSegment: number }[] = [
  { prefix: 'user-uploads/', fileIdSegment: 3 },
  { prefix: 'course-media/authors/', fileIdSegment: 3 },
  { prefix: 'course-media/official/', fileIdSegment: 2 },
];

interface StoredObject {
  name: string;
  fileId: string | null;
  createdAt: number | null;
}

async function listObjects(prefix: string): Promise<StoredObject[]> {
  const bucket = getAdminBucket();
  const objects: StoredObject[] = [];
  let pageToken: string | undefined;
  do {
    const [files, next] = await bucket.getFiles({
      prefix,
      maxResults: LIST_PAGE,
      pageToken,
      autoPaginate: false,
    });
    for (const file of files) {
      const segments = file.name.split('/');
      const entry = PREFIXES.find((candidate) => file.name.startsWith(candidate.prefix));
      const fileId = entry === undefined ? null : (segments[entry.fileIdSegment] ?? null);
      const created = file.metadata.timeCreated;
      objects.push({
        name: file.name,
        fileId: fileId !== null && FILE_ID_PATTERN.test(fileId) ? fileId : null,
        createdAt: typeof created === 'string' ? Date.parse(created) : null,
      });
    }
    pageToken = (next as { pageToken?: string } | null | undefined)?.pageToken;
  } while (pageToken !== undefined);
  return objects;
}

/** Which of the file ids have a files/{fileId} document. */
async function registeredIds(fileIds: readonly string[]): Promise<Set<string>> {
  const unique = [...new Set(fileIds)];
  const registered = new Set<string>();
  const db = getAdminDb();
  for (let start = 0; start < unique.length; start += READ_CHUNK) {
    const chunk = unique.slice(start, start + READ_CHUNK);
    const snapshots = await db.getAll(...chunk.map((fileId) => collections.files().doc(fileId)));
    snapshots.forEach((snapshot, index) => {
      if (snapshot.exists) registered.add(chunk[index]!);
    });
  }
  return registered;
}

async function cleanUnregisteredObjects(cutoff: number, dryRun: boolean): Promise<number> {
  const objects = (await Promise.all(PREFIXES.map((entry) => listObjects(entry.prefix)))).flat();
  const registered = await registeredIds(
    objects.flatMap((object) => (object.fileId === null ? [] : [object.fileId])),
  );
  const stale = objects.filter(
    (object) =>
      (object.fileId === null || !registered.has(object.fileId)) &&
      object.createdAt !== null &&
      object.createdAt < cutoff,
  );
  for (const object of stale) {
    console.log(`   ${dryRun ? 'would delete' : 'deleting'} object ${object.name}`);
    if (!dryRun) await deleteObject(object.name);
  }
  return stale.length;
}

async function cleanUnattachedFiles(cutoff: number, dryRun: boolean): Promise<number> {
  // Equality only (3.7); the age is judged here.
  const snapshot = await collections
    .files()
    .where('purpose', '==', 'submission')
    .where('submissionId', '==', null)
    .get();
  let deleted = 0;
  for (const document of snapshot.docs) {
    const createdAt: unknown = document.get('createdAt');
    const createdMs = createdAt instanceof Timestamp ? createdAt.toMillis() : null;
    if (createdMs === null || createdMs >= cutoff) continue;
    const storagePath: unknown = document.get('storagePath');
    console.log(`   ${dryRun ? 'would delete' : 'deleting'} unattached file ${document.id}`);
    if (!dryRun) {
      if (typeof storagePath === 'string') await deleteObject(storagePath);
      await document.ref.delete();
    }
    deleted += 1;
  }
  return deleted;
}

async function cleanExpiredRateLimits(dryRun: boolean): Promise<number> {
  const expired = collections.rateLimits().where('expiresAt', '<', Timestamp.now());
  if (dryRun) return (await expired.count().get()).data().count;
  return deleteMatching(expired);
}

async function main(): Promise<void> {
  const { values } = parseScriptArgs(
    {
      'dry-run': { type: 'boolean', default: false },
      'max-age-hours': { type: 'string' },
    },
    USAGE,
  );
  const dryRun = values['dry-run'] === true;
  const maxAgeHours =
    values['max-age-hours'] === undefined ? DEFAULT_MAX_AGE_HOURS : Number(values['max-age-hours']);
  if (!Number.isFinite(maxAgeHours) || maxAgeHours < 0) {
    throw new ScriptError('--max-age-hours must be a non-negative number.');
  }
  await connect(targetOptions(values));
  const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;

  step(`Unregistered objects older than ${maxAgeHours} h${dryRun ? ' (dry run)' : ''}`);
  const objects = await cleanUnregisteredObjects(cutoff, dryRun);
  step(`Unattached submission files older than ${maxAgeHours} h${dryRun ? ' (dry run)' : ''}`);
  const files = await cleanUnattachedFiles(cutoff, dryRun);
  step(`Expired rate-limit buckets${dryRun ? ' (dry run)' : ''}`);
  const buckets = await cleanExpiredRateLimits(dryRun);

  console.log(
    `\ncleanup-uploads: ${objects} objects, ${files} file records, ${buckets} rate-limit buckets${dryRun ? ' would be' : ''} deleted.`,
  );
}

runScript(main);
