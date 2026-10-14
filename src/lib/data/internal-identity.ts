import 'server-only';
import type {
  CollectionReference,
  DocumentData,
  DocumentReference,
  Query,
  UpdateData,
} from 'firebase-admin/firestore';
import { canViewUser } from '@/lib/auth/authz';
import { isSystem, type Actor } from '@/lib/auth/actor';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { collections } from '@/lib/firebase/collections';
import { fromSnapshot, fromSnapshotOrNull } from '@/lib/firebase/converters';
import { AI_LIMITS } from '@/lib/limits';
import { COMPOSITE_ID_PATTERN, ID_PATTERN } from '@/lib/schemas/common';
import type { Page, PageRequest } from '@/types/common';
import type { UserProfile } from '@/types/user';

// Private to the repositories of this folder: nothing here authorizes, so nothing outside
// src/lib/data may import it.

// --- Ids ---------------------------------------------------------------------------------------

/**
 * An id is put into a document path, where 'a/b/c' would address another document. Actions
 * validate ids with idSchema; this is the same check for every other caller, and it answers
 * as if the document did not exist.
 */
export function assertId(id: string, pattern: RegExp = ID_PATTERN): void {
  if (typeof id !== 'string' || !pattern.test(id)) throw new NotFoundError('Malformed id.');
}

export function isId(id: unknown): id is string {
  return typeof id === 'string' && ID_PATTERN.test(id);
}

export function userDoc(uid: string): DocumentReference {
  assertId(uid);
  return collections.users().doc(uid);
}

/** What is stored where a document names who wrote it. */
export function actorUid(actor: Actor): string {
  return isSystem(actor) ? 'system' : actor.uid;
}

export function isActorUid(actor: Actor, uid: string): boolean {
  return !isSystem(actor) && actor.uid === uid;
}

// --- Firestore errors --------------------------------------------------------------------------

function hasStatus(error: unknown, status: number): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === status;
}

/** create() on a document that exists (gRPC ALREADY_EXISTS). */
export function isAlreadyExists(error: unknown): boolean {
  return hasStatus(error, 6);
}

/** update() on a document that does not exist (gRPC NOT_FOUND). */
export function isMissingDocument(error: unknown): boolean {
  return hasStatus(error, 5);
}

export async function updateExisting(ref: DocumentReference, data: UpdateData<object>) {
  try {
    await ref.update(data);
  } catch (error) {
    if (isMissingDocument(error)) throw new NotFoundError(`${ref.path} does not exist.`);
    throw error;
  }
}

// --- Users -------------------------------------------------------------------------------------

export async function readProfile(uid: string): Promise<UserProfile | null> {
  if (!isId(uid)) return null;
  return fromSnapshotOrNull<UserProfile>(await collections.users().doc(uid).get());
}

/**
 * Gate of the per-user lists (badges, XP history, certificates): the user themselves, a school
 * admin of their school, a teacher of one of their classes, a platform admin. Anyone else
 * learns nothing, not even whether the user exists.
 */
export async function assertCanViewUser(actor: Actor, uid: string): Promise<void> {
  if (isSystem(actor) || actor.uid === uid || actor.role === 'platform_admin') return;
  // A student sees nobody but themselves, so no profile can change that answer.
  const profile = actor.role === 'student' ? null : await readProfile(uid);
  if (profile === null || !canViewUser(actor, profile)) {
    throw new NotFoundError(`users/${uid} does not exist.`);
  }
}

// --- Schools -----------------------------------------------------------------------------------

/** 1–200, whatever was stored or sent; null means "use the platform default". */
export function clampAiDailyMessageLimit(limit: number | null | undefined): number | null {
  if (limit === null || limit === undefined || !Number.isFinite(limit)) return null;
  const { min, max } = AI_LIMITS.schoolDailyMessageLimit;
  return Math.min(max, Math.max(min, Math.round(limit)));
}

// --- Pages -------------------------------------------------------------------------------------

export const PAGE_SIZE = { default: 50, max: 100 } as const;

export function clampLimit(limit: number | undefined, fallback: number = PAGE_SIZE.default) {
  if (limit === undefined || !Number.isFinite(limit)) return fallback;
  return Math.min(PAGE_SIZE.max, Math.max(1, Math.trunc(limit)));
}

/**
 * One page of an ordered query. The cursor is the id of the last document of the previous
 * page; that document is read again and the query continues after it, so the query keeps the
 * shape (and the index) it has without a cursor. `belongs` says whether a document is part of
 * the list being paged; a cursor that names any other document is refused the same way as an
 * unknown one, so a cursor cannot be used to probe for documents outside the list.
 */
export async function readPage<T>(
  query: Query,
  collection: CollectionReference,
  page: PageRequest | undefined,
  belongs: (data: DocumentData) => boolean,
): Promise<Page<T>> {
  const limit = clampLimit(page?.limit);
  const cursor = page?.cursor ?? null;
  let ordered = query;
  if (cursor !== null) {
    const anchor = COMPOSITE_ID_PATTERN.test(cursor) ? await collection.doc(cursor).get() : null;
    const data = anchor?.data();
    if (!anchor || data === undefined || !belongs(data)) {
      throw new ValidationError('Unknown page cursor.', { cursor: ['invalid'] });
    }
    ordered = ordered.startAfter(anchor);
  }
  const snapshot = await ordered.limit(limit + 1).get();
  const documents = snapshot.docs.slice(0, limit);
  return {
    items: documents.map((document) => fromSnapshot<T>(document)),
    nextCursor: snapshot.docs.length > limit ? (documents.at(-1)?.id ?? null) : null,
  };
}
