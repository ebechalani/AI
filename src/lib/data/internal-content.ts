import 'server-only';
import type {
  CollectionReference,
  DocumentData,
  DocumentReference,
  Query,
  Transaction,
} from 'firebase-admin/firestore';
import { isSystem, type Actor } from '@/lib/auth/actor';
import {
  assertCan,
  canEditCourse,
  canManageClass,
  canViewCourse,
  isPlatformAdmin,
  teachesClass,
} from '@/lib/auth/authz';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { collections, docIds } from '@/lib/firebase/collections';
import { fromSnapshot } from '@/lib/firebase/converters';
import { COMPOSITE_ID_PATTERN, ID_PATTERN } from '@/lib/schemas/common';
import type { Page, PageRequest } from '@/types/common';
import type { Course } from '@/types/content';
import type { Session } from '@/types/user';
import { getClass } from './classes';

// Private to the content and learning repositories (courses, quizzes, projects, enrollments,
// submissions, analytics). Nothing here is a repository function: the callers authorize, or
// call one of the assert* helpers below, before they hand out what these return.

// --- Ids ---------------------------------------------------------------------------------------

/**
 * Ids end up in document paths and in field paths ('quizSummary.<quizId>'), where a '/' or a
 * '.' would address something else. Actions check them with idSchema; a page passes a route
 * parameter straight in. A malformed id cannot name a document, so it reads as "not found".
 */
export function assertId(id: string): void {
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) throw new NotFoundError('Malformed id.');
}

export function assertCompositeId(id: string): void {
  if (typeof id !== 'string' || !COMPOSITE_ID_PATTERN.test(id)) {
    throw new NotFoundError('Malformed id.');
  }
}

export function isId(id: unknown): id is string {
  return typeof id === 'string' && ID_PATTERN.test(id);
}

// --- Actors ------------------------------------------------------------------------------------

export function isSelf(actor: Actor, uid: string): boolean {
  return !isSystem(actor) && actor.uid === uid;
}

/** For writes that record who made them: the system has no uid to record. */
export function requireSession(actor: Actor, what: string): Session {
  if (isSystem(actor)) throw new ForbiddenError(`${what} needs a signed-in user.`);
  return actor;
}

/** Own records, plus everything for the system and platform admins. */
export function isSelfOrAdmin(actor: Actor, uid: string): boolean {
  return isPlatformAdmin(actor) || isSelf(actor, uid);
}

/**
 * Gate of the per-class lists of learner records (attempts, submissions): a teacher of the
 * class, a school admin of its school (one class read), a platform admin. Never a student,
 * although a member may see the class itself.
 */
export async function assertCanReadClassRecords(actor: Actor, classId: string): Promise<void> {
  assertId(classId);
  if (isPlatformAdmin(actor) || teachesClass(actor, classId)) return;
  if (isSystem(actor) || actor.role !== 'school_admin') throw new ForbiddenError('class.records');
  assertCan(canManageClass(actor, await getClass(actor, classId)), 'class.records');
}

const MAX_IN_VALUES = 30;

/**
 * For the lists that take the caller's own `classIds` (review queue, recent attempts): every
 * id must be a class the actor teaches. Returns the ids without repeats; an `in` filter takes
 * at most 30 values, which is also the most classes a user can have.
 */
export function assertTeachesAll(actor: Actor, classIds: string[]): string[] {
  const unique = [...new Set(classIds)];
  if (unique.length > MAX_IN_VALUES) throw new ValidationError('Too many classes.');
  for (const classId of unique) {
    assertId(classId);
    if (!isPlatformAdmin(actor) && !teachesClass(actor, classId)) {
      throw new ForbiddenError(`Not a teacher of class ${classId}.`);
    }
  }
  return unique;
}

// --- Courses -----------------------------------------------------------------------------------

export function courseDoc(courseId: string): DocumentReference {
  assertId(courseId);
  return collections.courses().doc(courseId);
}

export async function loadCourse(courseId: string): Promise<Course> {
  return fromSnapshot<Course>(await courseDoc(courseId).get());
}

export async function isEnrolled(uid: string, courseId: string): Promise<boolean> {
  const snapshot = await collections.enrollments().doc(docIds.enrollment(uid, courseId)).get();
  return snapshot.exists;
}

/**
 * canViewCourse, reading the enrollment only when it can change the answer: a teacher-made
 * course that nothing else lets the actor see.
 */
export async function canActorViewCourse(actor: Actor, course: Course): Promise<boolean> {
  if (canViewCourse(actor, course, { enrolled: false })) return true;
  if (isSystem(actor) || course.isOfficial) return false;
  return canViewCourse(actor, course, { enrolled: await isEnrolled(actor.uid, course.id) });
}

export async function loadViewableCourse(actor: Actor, courseId: string): Promise<Course> {
  const course = await loadCourse(courseId);
  assertCan(await canActorViewCourse(actor, course), 'course.view');
  return course;
}

export async function loadEditableCourse(actor: Actor, courseId: string): Promise<Course> {
  const course = await loadCourse(courseId);
  assertCan(canEditCourse(actor, course), 'course.edit');
  return course;
}

/** `enrollments where courseId == X limit 1` (3.7, internal), inside a transaction or not. */
export async function courseHasEnrollments(courseId: string, tx?: Transaction): Promise<boolean> {
  const query = collections.enrollments().where('courseId', '==', courseId).limit(1);
  const snapshot = await (tx ? tx.get(query) : query.get());
  return !snapshot.empty;
}

/** The rule of 3.1: course structure is deleted only while nobody is enrolled. */
export async function assertNoEnrollments(tx: Transaction, courseId: string): Promise<void> {
  if (await courseHasEnrollments(courseId, tx)) {
    throw new ConflictError(
      `courses/${courseId} has enrollments; its structure cannot be deleted.`,
    );
  }
}

/** Position of a new module, lesson or block: after the last one. */
export function nextOrder(siblings: readonly { order: number }[]): number {
  return siblings.reduce((highest, sibling) => Math.max(highest, sibling.order), -1) + 1;
}

/** A reorder must name every sibling exactly once; anything else was built from a stale list. */
export function assertSameIds(orderedIds: string[], existingIds: string[], what: string): void {
  const wanted = new Set(orderedIds);
  const same =
    wanted.size === orderedIds.length &&
    orderedIds.length === existingIds.length &&
    existingIds.every((id) => wanted.has(id));
  if (!same) throw new ConflictError(`The ${what} to reorder are not the ones stored.`);
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

export async function updateExisting(ref: DocumentReference, data: DocumentData): Promise<void> {
  try {
    await ref.update(data);
  } catch (error) {
    if (isMissingDocument(error)) throw new NotFoundError(`${ref.path} does not exist.`);
    throw error;
  }
}

// --- Lists and pages ---------------------------------------------------------------------------

export const PAGE_SIZE = { default: 50, max: 100 } as const;

export function clampLimit(
  limit: number | undefined,
  fallback: number = PAGE_SIZE.default,
  max: number = PAGE_SIZE.max,
): number {
  if (limit === undefined || !Number.isFinite(limit)) return fallback;
  return Math.min(max, Math.max(1, Math.trunc(limit)));
}

/**
 * One page of an ordered query. The cursor is the id of the last document of the previous
 * page: that document is read again and the query continues after it, so a paged query keeps
 * the shape, and the index, of the unpaged one. `belongs` says whether a document is part of
 * the list being paged; a cursor that names any other document is refused, so a cursor cannot
 * be used to probe for documents outside the list.
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

/** Newest first by an ISO date, for the equality-only queries that cannot order on the server (3.7). */
export function byNewest<T>(field: (item: T) => string): (a: T, b: T) => number {
  return (a, b) => {
    const [left, right] = [field(a), field(b)];
    return left < right ? 1 : left > right ? -1 : 0;
  };
}
