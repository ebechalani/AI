// Erases one user (ARCHITECTURE.md 3.1, 12): the Auth account, the profile with its badges and
// XP ledger, the class memberships, enrollments and progress, quiz attempts, submissions with
// their reviews, the file records and the uploaded objects, and the usage counters. Records
// that must remain keep no name: certificates stay valid for verification with an anonymised
// recipient. Nothing is undone; the script asks before it starts.
//
//   npm run user:delete -- <uid-or-email> [--allow-project <id>] [--yes]

import type { Query } from 'firebase-admin/firestore';
import { SYSTEM_ACTOR } from '@/lib/auth/actor';
import { removeUserFromAllClasses } from '@/lib/data/classes';
import { adjustSchoolCounts } from '@/lib/data/schools';
import { getUser } from '@/lib/data/users';
import { ConflictError } from '@/lib/errors';
import { getAdminAuth, getAdminBucket, getAdminDb } from '@/lib/firebase/admin';
import { collections } from '@/lib/firebase/collections';
import { updatedNow } from '@/lib/firebase/converters';
import { deleteObject } from '@/lib/firebase/storage-admin';
import { userUploadPath } from '@/lib/firebase/storage-paths';
import { ID_PATTERN } from '@/lib/schemas/common';
import { countedIn, invalidateSessions } from '@/lib/services/identity';
import type { UserProfile } from '@/types/user';
import {
  COMMON_USAGE,
  confirm,
  connect,
  parseScriptArgs,
  runScript,
  ScriptError,
  step,
  targetOptions,
} from './lib/admin';
import { deleteMatching, deleteTree, ifFound } from './lib/firestore';

const USAGE = `Usage: npm run user:delete -- <uid-or-email> [options]

Erases the user's account, records and files; anonymises the name on their certificates.
${COMMON_USAGE}`;

const ANONYMISED_NAME = 'Deleted user';

function authErrorCode(error: unknown): string | null {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
    ? error.code
    : null;
}

async function resolveUid(identifier: string): Promise<string> {
  if (!identifier.includes('@')) {
    if (!ID_PATTERN.test(identifier)) throw new ScriptError(`"${identifier}" is not a uid.`);
    return identifier;
  }
  try {
    return (await getAdminAuth().getUserByEmail(identifier.trim().toLowerCase())).uid;
  } catch (error) {
    if (authErrorCode(error) === 'auth/user-not-found') {
      throw new ScriptError(`No Auth account has the address ${identifier}.`);
    }
    throw error;
  }
}

async function countOf(query: Query): Promise<number> {
  return (await query.count().get()).data().count;
}

async function leaveClasses(profile: UserProfile): Promise<void> {
  try {
    await removeUserFromAllClasses(SYSTEM_ACTOR, profile.id);
  } catch (error) {
    if (error instanceof ConflictError) {
      throw new ScriptError(
        `${profile.id} owns a class that is not archived; archive it or hand it over first.`,
      );
    }
    throw error;
  }
}

/** Submissions with their reviews; a challenge counts one entrant fewer per challenge entered. */
async function deleteSubmissions(uid: string): Promise<number> {
  const db = getAdminDb();
  const snapshot = await collections.submissions().where('studentUid', '==', uid).get();
  const challengeIds = new Set<string>();
  for (const document of snapshot.docs) {
    const challengeId: unknown = document.get('challengeId');
    if (typeof challengeId === 'string') challengeIds.add(challengeId);
    await db.recursiveDelete(document.ref);
  }
  for (const challengeId of challengeIds) {
    const ref = collections.challenges().doc(challengeId);
    await db.runTransaction(async (tx) => {
      const challenge = await tx.get(ref);
      if (!challenge.exists) return;
      const count = Number(challenge.get('submissionCount') ?? 0);
      tx.update(ref, { submissionCount: Math.max(0, count - 1), ...updatedNow() });
    });
  }
  return snapshot.size;
}

/** The file records and their objects, then whatever else lies under the user's upload prefix. */
async function deleteFiles(uid: string): Promise<number> {
  const snapshot = await collections.files().where('ownerUid', '==', uid).get();
  for (const document of snapshot.docs) {
    const storagePath: unknown = document.get('storagePath');
    if (typeof storagePath === 'string') await deleteObject(storagePath);
    await document.ref.delete();
  }
  // The prefix of every object the user could upload for a submission (5.2).
  const prefix = userUploadPath(uid, 'image', '00000000-0000-0000-0000-000000000000', 'x').split(
    '/image/',
  )[0]!;
  await getAdminBucket().deleteFiles({ prefix: `${prefix}/`, force: true });
  return snapshot.size;
}

async function anonymiseCertificates(uid: string): Promise<number> {
  const snapshot = await collections.certificates().where('userUid', '==', uid).get();
  const batch = getAdminDb().batch();
  for (const document of snapshot.docs) {
    batch.update(document.ref, { recipientName: ANONYMISED_NAME, ...updatedNow() });
  }
  await batch.commit();
  return snapshot.size;
}

async function main(): Promise<void> {
  const { values, positionals } = parseScriptArgs({}, USAGE);
  if (positionals.length !== 1) throw new ScriptError(USAGE);
  const options = targetOptions(values);
  await connect(options);

  const uid = await resolveUid(positionals[0]!);
  const profile = await ifFound(getUser(SYSTEM_ACTOR, uid));
  const auth = getAdminAuth();
  const authUser = await auth.getUser(uid).catch((error: unknown) => {
    if (authErrorCode(error) === 'auth/user-not-found') return null;
    throw error;
  });
  if (profile === null && authUser === null) {
    throw new ScriptError(`Nothing is known about ${uid}: no profile and no Auth account.`);
  }

  step(`Delete ${uid}`);
  const counts = {
    enrollments: await countOf(collections.enrollments().where('userUid', '==', uid)),
    attempts: await countOf(collections.quizAttempts().where('userUid', '==', uid)),
    submissions: await countOf(collections.submissions().where('studentUid', '==', uid)),
    files: await countOf(collections.files().where('ownerUid', '==', uid)),
    certificates: await countOf(collections.certificates().where('userUid', '==', uid)),
  };
  console.log(
    `   ${profile === null ? 'no profile' : `${profile.role} "${profile.displayName}"`}, ${authUser === null ? 'no Auth account' : `Auth account ${authUser.email ?? authUser.uid}`}`,
  );
  console.log(
    `   ${counts.enrollments} enrollments, ${counts.attempts} quiz attempts, ${counts.submissions} submissions, ${counts.files} files; ${counts.certificates} certificates will be anonymised`,
  );
  if (!options.yes && !(await confirm('Erase this user? This cannot be undone.'))) {
    throw new ScriptError('Aborted.');
  }

  if (profile !== null) {
    await invalidateSessions(uid);
    await leaveClasses(profile);
    const counted = countedIn(profile);
    if (counted !== null) {
      await adjustSchoolCounts(SYSTEM_ACTOR, counted.schoolId, { [counted.counter]: -1 });
    }
  }
  const submissions = await deleteSubmissions(uid);
  const attempts = await deleteMatching(collections.quizAttempts().where('userUid', '==', uid));
  const enrollments = await deleteMatching(collections.enrollments().where('userUid', '==', uid));
  const files = await deleteFiles(uid);
  const certificates = await anonymiseCertificates(uid);
  const usage =
    (await deleteMatching(collections.aiUsage().where('uid', '==', uid))) +
    (await deleteMatching(collections.uploadUsage().where('uid', '==', uid)));
  await deleteTree(collections.users().doc(uid));
  if (authUser !== null) await auth.deleteUser(uid);

  // Audit entries name the uid only; they stay, as the trail of what was done to the account.
  console.log(
    `   erased: profile, ${enrollments} enrollments, ${attempts} attempts, ${submissions} submissions, ${files} files, ${usage} usage counters${authUser === null ? '' : ', the Auth account'}; ${certificates} certificates anonymised`,
  );
}

runScript(main);
