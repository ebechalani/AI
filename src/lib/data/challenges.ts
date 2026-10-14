import 'server-only';
import { Timestamp, type DocumentReference, type Query } from 'firebase-admin/firestore';
import { isSystem, type Actor } from '@/lib/auth/actor';
import { assertCan, canViewChallenge, isPlatformAdmin } from '@/lib/auth/authz';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { collections } from '@/lib/firebase/collections';
import {
  createdNow,
  fromQuery,
  fromSnapshot,
  fromSnapshotOrNull,
  toTimestamp,
  updatedNow,
} from '@/lib/firebase/converters';
import { isPublicMediaPath } from '@/lib/firebase/storage-paths';
import { challengeInputSchema } from '@/lib/schemas/admin';
import { parseInput } from '@/lib/schemas/common';
import { CHALLENGE_STATUSES, type Challenge, type ChallengeStatus } from '@/types/challenge';
import type { MediaRef } from '@/types/common';
import type { ChallengeInput } from '@/types/inputs';
import { getFile, toMediaRef } from './files';
import { actorUid, assertId, clampLimit, updateExisting } from './internal-identity';

function challengeDoc(challengeId: string): DocumentReference {
  assertId(challengeId);
  return collections.challenges().doc(challengeId);
}

/** A cover is official media registered without a course; anything else is refused. */
async function resolveCover(
  actor: Actor,
  fileId: string | null,
  current: MediaRef | null,
): Promise<MediaRef | null> {
  if (fileId === null) return null;
  if (current?.fileId === fileId) return current;
  const refuse = () =>
    new ValidationError('Not a challenge cover.', { coverImageFileId: ['invalid'] });
  const file = await getFile(actor, fileId).catch((error: unknown) => {
    if (error instanceof NotFoundError) throw refuse();
    throw error;
  });
  const official =
    file.purpose === 'course_media' &&
    file.courseId === null &&
    file.kind === 'image' &&
    isPublicMediaPath(file.storagePath);
  if (!official) throw refuse();
  return toMediaRef(file);
}

/** A draft or archived challenge, or one of another school, does not exist for the actor. */
export async function getChallenge(actor: Actor, challengeId: string): Promise<Challenge> {
  const challenge = fromSnapshotOrNull<Challenge>(await challengeDoc(challengeId).get());
  if (challenge === null || !canViewChallenge(actor, challenge)) {
    throw new NotFoundError(`challenges/${challengeId} does not exist.`);
  }
  return challenge;
}

/**
 * Published challenges for everyone plus, for an actor who has a school, those of that school;
 * soonest deadline first. `upcomingOrOpenOnly` leaves out the ones whose deadline has passed.
 */
export async function listChallengesForUser(
  actor: Actor,
  opts?: { upcomingOrOpenOnly?: boolean; limit?: number },
): Promise<Challenge[]> {
  const limit = opts?.limit === undefined ? null : clampLimit(opts.limit);
  const now = Timestamp.now();
  const finish = (scoped: Query): Query => {
    const open = opts?.upcomingOrOpenOnly ? scoped.where('deadlineAt', '>=', now) : scoped;
    const ordered = open.orderBy('deadlineAt');
    return limit === null ? ordered : ordered.limit(limit);
  };
  const published = collections.challenges().where('status', '==', 'published');
  const schoolId = isSystem(actor) ? null : actor.schoolId;

  const snapshots = await Promise.all([
    finish(published.where('scope', '==', 'global')).get(),
    ...(schoolId === null ? [] : [finish(published.where('schoolId', '==', schoolId)).get()]),
  ]);
  const challenges = snapshots
    .flatMap((snapshot) => fromQuery<Challenge>(snapshot))
    .sort((a, b) => a.deadlineAt.localeCompare(b.deadlineAt));
  return limit === null ? challenges : challenges.slice(0, limit);
}

/** Every challenge, drafts and archived ones included; latest deadline first. */
export async function listAllChallenges(actor: Actor): Promise<Challenge[]> {
  assertCan(isPlatformAdmin(actor), 'challenges.list');
  const snapshot = await collections.challenges().orderBy('deadlineAt', 'desc').get();
  return fromQuery<Challenge>(snapshot);
}

/** A new challenge is a draft; its status changes only through setChallengeStatus. */
export async function upsertChallenge(
  actor: Actor,
  challengeId: string | null,
  input: ChallengeInput,
): Promise<Challenge> {
  assertCan(isPlatformAdmin(actor), 'challenge.upsert');
  const parsed = parseInput(challengeInputSchema, input);
  if (!parsed.success) throw new ValidationError('Invalid challenge.', parsed.fieldErrors);
  const { coverImageFileId, startAt, deadlineAt, ...fields } = parsed.data;

  const ref = challengeId === null ? collections.challenges().doc() : challengeDoc(challengeId);
  const current = challengeId === null ? null : fromSnapshot<Challenge>(await ref.get()).coverImage;
  const data = {
    ...fields,
    startAt: toTimestamp(startAt),
    deadlineAt: toTimestamp(deadlineAt),
    coverImage: await resolveCover(actor, coverImageFileId, current),
  };

  if (challengeId === null) {
    await ref.create({
      ...data,
      status: 'draft' satisfies ChallengeStatus,
      submissionCount: 0,
      createdByUid: actorUid(actor),
      ...createdNow(),
    });
  } else {
    await updateExisting(ref, { ...data, ...updatedNow() });
  }
  return fromSnapshot<Challenge>(await ref.get());
}

export async function setChallengeStatus(
  actor: Actor,
  challengeId: string,
  status: Challenge['status'],
): Promise<void> {
  assertCan(isPlatformAdmin(actor), 'challenge.set_status');
  if (!CHALLENGE_STATUSES.includes(status)) {
    throw new ValidationError('Unknown challenge status.', { status: ['invalid_choice'] });
  }
  await updateExisting(challengeDoc(challengeId), { status, ...updatedNow() });
}
