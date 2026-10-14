// Firestore helpers for the scripts that write documents no repository creates (reference data,
// seeded course structure) or erase what the application never deletes. Every write here is
// one the contract reserves for scripts (ARCHITECTURE.md 3.1, 11.2); application data goes
// through the repositories.

import type {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  Query,
} from 'firebase-admin/firestore';
import { NotFoundError } from '@/lib/errors';
import { getAdminDb } from '@/lib/firebase/admin';
import { serverTimestamp } from '@/lib/firebase/converters';

/** A repository read that answers null instead of throwing NotFoundError. */
export async function ifFound<T>(read: Promise<T>): Promise<T | null> {
  try {
    return await read;
  } catch (error) {
    if (error instanceof NotFoundError) return null;
    throw error;
  }
}

const READ_CHUNK = 300;
const WRITE_CHUNK = 400;

export interface DocumentWrite {
  ref: DocumentReference;
  /** The fields without timestamps, or a function of the stored document (null when new). */
  fields: DocumentData | ((existing: DocumentSnapshot | null) => DocumentData);
}

function chunks<T>(items: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    result.push(items.slice(start, start + size));
  }
  return result;
}

async function readAll(refs: readonly DocumentReference[]): Promise<DocumentSnapshot[]> {
  const db = getAdminDb();
  const snapshots: DocumentSnapshot[] = [];
  for (const chunk of chunks(refs, READ_CHUNK)) {
    snapshots.push(...(await db.getAll(...chunk)));
  }
  return snapshots;
}

/**
 * Writes every document whole (an upsert by id): a new document gets `createdAt` and
 * `updatedAt`, an existing one keeps its `createdAt` and gets a fresh `updatedAt`. Fields the
 * new version does not name are dropped, so a document carries exactly what the writer says.
 */
export async function upsertDocuments(
  writes: readonly DocumentWrite[],
): Promise<{ created: number; updated: number }> {
  if (writes.length === 0) return { created: 0, updated: 0 };
  const existing = await readAll(writes.map((write) => write.ref));
  const db = getAdminDb();
  let created = 0;
  let updated = 0;

  for (const chunk of chunks(
    writes.map((write, index) => ({ write, snapshot: existing[index]! })),
    WRITE_CHUNK,
  )) {
    const batch = db.batch();
    for (const { write, snapshot } of chunk) {
      const fields =
        typeof write.fields === 'function'
          ? write.fields(snapshot.exists ? snapshot : null)
          : write.fields;
      const createdAt: unknown = snapshot.exists ? snapshot.get('createdAt') : undefined;
      batch.set(write.ref, {
        ...fields,
        createdAt: createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      if (snapshot.exists) updated += 1;
      else created += 1;
    }
    await batch.commit();
  }
  return { created, updated };
}

/** Deletes the documents of a query, page by page, with their subcollections. Returns how many. */
export async function deleteMatching(query: Query): Promise<number> {
  const db = getAdminDb();
  let deleted = 0;
  for (;;) {
    const page = await query.limit(WRITE_CHUNK).get();
    if (page.empty) return deleted;
    for (const document of page.docs) await db.recursiveDelete(document.ref);
    deleted += page.size;
    if (page.size < WRITE_CHUNK) return deleted;
  }
}

/** Deletes one document with everything below it; nothing happens when it does not exist. */
export async function deleteTree(ref: DocumentReference): Promise<void> {
  await getAdminDb().recursiveDelete(ref);
}
