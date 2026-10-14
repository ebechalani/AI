import 'server-only';
import { FieldValue, type DocumentReference } from 'firebase-admin/firestore';
import { assertSystem, isSystem, type Actor } from '@/lib/auth/actor';
import { assertCan, canViewLearnerRecord, hasRole, teachesClass } from '@/lib/auth/authz';
import { ConflictError, ValidationError } from '@/lib/errors';
import { getAdminDb } from '@/lib/firebase/admin';
import { collections, docIds } from '@/lib/firebase/collections';
import {
  createdNow,
  fromQuery,
  fromSnapshot,
  fromSnapshotOrNull,
  serverTimestamp,
  updatedNow,
} from '@/lib/firebase/converters';
import { CONTENT_LIMITS } from '@/lib/limits';
import type { Lesson } from '@/types/content';
import type { Enrollment, LessonProgress } from '@/types/learning';
import { lessonProgressOf } from './course-derive';
import {
  assertId,
  byNewest,
  courseHasEnrollments,
  isAlreadyExists,
  isSelf,
  isSelfOrAdmin,
  loadEditableCourse,
  updateExisting,
} from './internal-content';

/** Built by services: `classId` and `schoolId` come from classroom.resolveClassContext. */
export interface NewEnrollment {
  userUid: string;
  courseId: string;
  /** The supervising class; null = unsupervised. */
  classId: string | null;
  schoolId: string | null;
  source: 'self' | 'class';
  /** `courses.lessonCount` when the learner enrolls. */
  totalLessonCount: number;
}

function enrollmentDoc(userUid: string, courseId: string): DocumentReference {
  assertId(userUid);
  assertId(courseId);
  return collections.enrollments().doc(docIds.enrollment(userUid, courseId));
}

function progressDoc(userUid: string, courseId: string, lessonId: string): DocumentReference {
  assertId(lessonId);
  return collections.lessonProgress(enrollmentDoc(userUid, courseId).id).doc(lessonId);
}

function newEnrollmentFields(input: NewEnrollment) {
  return {
    userUid: input.userUid,
    courseId: input.courseId,
    schoolId: input.schoolId,
    classId: input.classId,
    source: input.source,
    status: 'active' satisfies Enrollment['status'],
    completedLessonIds: [],
    completedLessonCount: 0,
    totalLessonCount: input.totalLessonCount,
    progressPercent: 0,
    lastLessonId: null,
    lastActivityAt: serverTimestamp(),
    startedAt: serverTimestamp(),
    completedAt: null,
    certificateId: null,
    quizSummary: {},
    projectSummary: {},
    ...createdNow(),
  };
}

// Learning happens under one's own name: nobody, a platform admin included, starts or
// completes a lesson for someone else. The system does, when a service has authorized.
function assertOwnLearning(actor: Actor, userUid: string, what: string): void {
  assertCan(isSystem(actor) || isSelf(actor, userUid), what);
}

// --- Reads -------------------------------------------------------------------------------------

/**
 * null when the user is not enrolled. Staff may be told so; a student may only ask about
 * themselves.
 */
export async function getEnrollment(
  actor: Actor,
  userUid: string,
  courseId: string,
): Promise<Enrollment | null> {
  const enrollment = fromSnapshotOrNull<Enrollment>(await enrollmentDoc(userUid, courseId).get());
  if (enrollment === null) {
    assertCan(
      isSelfOrAdmin(actor, userUid) || hasRole(actor, 'teacher', 'school_admin'),
      'enrollment.view',
    );
    return null;
  }
  assertCan(canViewLearnerRecord(actor, enrollment), 'enrollment.view');
  return enrollment;
}

/**
 * Most recently active first. The learner sees all their enrollments. A teacher must name a
 * class they teach and sees the enrollments that class supervises; a school admin sees those
 * of their school.
 */
export async function listEnrollmentsForUser(
  actor: Actor,
  userUid: string,
  opts?: { classId?: string },
): Promise<Enrollment[]> {
  assertId(userUid);
  const classId = opts?.classId;
  if (classId !== undefined) assertId(classId);

  const self = isSelf(actor, userUid);
  const teacher = !self && !isSystem(actor) && actor.role === 'teacher';
  const schoolAdmin = !self && !isSystem(actor) && actor.role === 'school_admin';
  if (teacher) {
    assertCan(classId !== undefined && teachesClass(actor, classId), 'enrollments.list');
  } else {
    assertCan(isSelfOrAdmin(actor, userUid) || schoolAdmin, 'enrollments.list');
  }

  const enrollments = collections.enrollments();
  let found: Enrollment[];
  if (classId !== undefined && !self) {
    const snapshot = await enrollments
      .where('classId', '==', classId)
      .where('userUid', '==', userUid)
      .get();
    found = fromQuery<Enrollment>(snapshot).sort(byNewest((item) => item.lastActivityAt));
  } else {
    const snapshot = await enrollments
      .where('userUid', '==', userUid)
      .orderBy('lastActivityAt', 'desc')
      .get();
    found = fromQuery<Enrollment>(snapshot);
  }
  return schoolAdmin ? found.filter((item) => canViewLearnerRecord(actor, item)) : found;
}

/**
 * One batched read. The result has an entry, possibly null, for every uid asked for; look a
 * uid up with Object.hasOwn. Refused as a whole when one of the enrollments is not the
 * actor's to see.
 */
export async function getEnrollmentsForUsers(
  actor: Actor,
  userUids: string[],
  courseId: string,
): Promise<Record<string, Enrollment | null>> {
  const uids = [...new Set(userUids)];
  const result: Record<string, Enrollment | null> = {};
  if (uids.length === 0) return result;
  const snapshots = await getAdminDb().getAll(...uids.map((uid) => enrollmentDoc(uid, courseId)));
  snapshots.forEach((snapshot, index) => {
    const enrollment = fromSnapshotOrNull<Enrollment>(snapshot);
    if (enrollment !== null) {
      assertCan(canViewLearnerRecord(actor, enrollment), 'enrollment.view');
    }
    result[uids[index]!] = enrollment;
  });
  return result;
}

/** The delete guard of 3.1, for the course's editors. */
export async function hasEnrollments(actor: Actor, courseId: string): Promise<boolean> {
  await loadEditableCourse(actor, courseId);
  return courseHasEnrollments(courseId);
}

export async function getLessonProgress(
  actor: Actor,
  userUid: string,
  courseId: string,
  lessonId: string,
): Promise<LessonProgress | null> {
  const ref = progressDoc(userUid, courseId, lessonId);
  // Progress is seen through its enrollment, which carries the class and the school.
  if (!isSelfOrAdmin(actor, userUid) && (await getEnrollment(actor, userUid, courseId)) === null) {
    return null;
  }
  return fromSnapshotOrNull<LessonProgress>(await ref.get());
}

// --- Enrolling (system only) ---------------------------------------------------------------------

/** Idempotent: an existing enrollment is returned as it is. */
export async function createEnrollment(actor: Actor, input: NewEnrollment): Promise<Enrollment> {
  assertSystem(actor);
  const ref = enrollmentDoc(input.userUid, input.courseId);
  try {
    await ref.create(newEnrollmentFields(input));
  } catch (error) {
    if (!isAlreadyExists(error)) throw error;
  }
  return fromSnapshot<Enrollment>(await ref.get());
}

const UPSERT_CHUNK = 100;

/**
 * For every input: creates the enrollment when there is none; adopts an existing unsupervised
 * one (`classId: null`) into the class; leaves an enrollment that already has a class alone.
 */
export async function upsertClassEnrollments(actor: Actor, inputs: NewEnrollment[]): Promise<void> {
  assertSystem(actor);
  const byId = new Map<string, NewEnrollment>();
  for (const input of inputs) {
    const id = enrollmentDoc(input.userUid, input.courseId).id;
    if (!byId.has(id)) byId.set(id, input);
  }
  const unique = [...byId.values()];

  for (let start = 0; start < unique.length; start += UPSERT_CHUNK) {
    const chunk = unique.slice(start, start + UPSERT_CHUNK);
    await getAdminDb().runTransaction(async (tx) => {
      const snapshots = await tx.getAll(
        ...chunk.map((input) => enrollmentDoc(input.userUid, input.courseId)),
      );
      snapshots.forEach((snapshot, index) => {
        const input = chunk[index]!;
        if (!snapshot.exists) {
          tx.create(snapshot.ref, newEnrollmentFields(input));
        } else if (snapshot.get('classId') === null && input.classId !== null) {
          tx.update(snapshot.ref, {
            classId: input.classId,
            schoolId: input.schoolId,
            source: 'class' satisfies Enrollment['source'],
            ...updatedNow(),
          });
        }
      });
    });
  }
}

export async function setEnrollmentClassContext(
  actor: Actor,
  userUid: string,
  courseId: string,
  ctx: { classId: string | null; schoolId: string | null },
): Promise<void> {
  assertSystem(actor);
  await updateExisting(enrollmentDoc(userUid, courseId), {
    classId: ctx.classId,
    schoolId: ctx.schoolId,
    ...updatedNow(),
  });
}

/** The enrollments a class supervises for one student, for re-resolving them on removal. */
export async function listEnrollmentsForUserInClass(
  actor: Actor,
  userUid: string,
  classId: string,
): Promise<Enrollment[]> {
  assertSystem(actor);
  assertId(userUid);
  assertId(classId);
  const snapshot = await collections
    .enrollments()
    .where('userUid', '==', userUid)
    .where('classId', '==', classId)
    .get();
  return fromQuery<Enrollment>(snapshot);
}

export async function setEnrollmentCertificate(
  actor: Actor,
  userUid: string,
  courseId: string,
  certificateId: string | null,
): Promise<void> {
  assertSystem(actor);
  await updateExisting(enrollmentDoc(userUid, courseId), { certificateId, ...updatedNow() });
}

// --- Lesson progress -----------------------------------------------------------------------------

// A progress document that is not completed has no gamification effects waiting, so it is
// written with `effectsApplied: true`; applyLessonCompletion sets false (9.4).
function newProgressFields(userUid: string, courseId: string) {
  return {
    userUid,
    courseId,
    status: 'in_progress' satisfies LessonProgress['status'],
    responses: {},
    xpAwarded: 0,
    effectsApplied: true,
    startedAt: serverTimestamp(),
    completedAt: null,
    ...createdNow(),
  };
}

function lessonDoc(courseId: string, lessonId: string): DocumentReference {
  return collections.lessons(courseId).doc(lessonId);
}

/**
 * Creates the progress document on the first visit and makes the lesson the enrollment's
 * "continue learning" target. NotFoundError when the user is not enrolled or the course has
 * no such lesson.
 */
export async function markLessonStarted(
  actor: Actor,
  userUid: string,
  courseId: string,
  lessonId: string,
): Promise<void> {
  assertOwnLearning(actor, userUid, 'lesson.start');
  const enrollmentRef = enrollmentDoc(userUid, courseId);
  const ref = progressDoc(userUid, courseId, lessonId);
  await getAdminDb().runTransaction(async (tx) => {
    fromSnapshot<Enrollment>(await tx.get(enrollmentRef));
    const progress = await tx.get(ref);
    if (!progress.exists) {
      fromSnapshot<Lesson>(await tx.get(lessonDoc(courseId, lessonId)), { courseId });
      tx.create(ref, newProgressFields(userUid, courseId));
    }
    tx.update(enrollmentRef, {
      lastLessonId: lessonId,
      lastActivityAt: serverTimestamp(),
      ...updatedNow(),
    });
  });
}

/** The learner's text for a reflection or code-activity block; saving again replaces it. */
export async function saveBlockResponse(
  actor: Actor,
  userUid: string,
  courseId: string,
  lessonId: string,
  blockId: string,
  text: string,
): Promise<void> {
  assertOwnLearning(actor, userUid, 'lesson.respond');
  assertId(blockId);
  if (typeof text !== 'string' || text.length > CONTENT_LIMITS.blockResponseChars) {
    throw new ValidationError('The response is too long.', { text: ['too_long'] });
  }
  const enrollmentRef = enrollmentDoc(userUid, courseId);
  const ref = progressDoc(userUid, courseId, lessonId);
  const response = { text, updatedAt: serverTimestamp() };

  await getAdminDb().runTransaction(async (tx) => {
    fromSnapshot<Enrollment>(await tx.get(enrollmentRef));
    const progress = await tx.get(ref);
    if (!progress.exists) {
      fromSnapshot<Lesson>(await tx.get(lessonDoc(courseId, lessonId)), { courseId });
      tx.create(ref, {
        ...newProgressFields(userUid, courseId),
        responses: { [blockId]: response },
      });
      return;
    }
    const responses = (progress.get('responses') ?? {}) as Record<string, unknown>;
    // A lesson has at most this many blocks, so it has at most this many answers.
    if (
      !Object.hasOwn(responses, blockId) &&
      Object.keys(responses).length >= CONTENT_LIMITS.blocksPerLesson
    ) {
      throw new ConflictError(`Lesson ${lessonId} already has a response for every block.`);
    }
    tx.update(ref, { [`responses.${blockId}`]: response, ...updatedNow() });
  });
}

/**
 * Section 9.4, in one transaction: marks the lesson completed with `effectsApplied: false`
 * and updates the enrollment; when that was the last lesson and the course had never been
 * completed, also completes the enrollment and counts it in `users.stats.coursesCompleted`.
 *
 * Completing a completed lesson again writes nothing and reports `alreadyCompleted`, with
 * the `effectsApplied` flag as stored, so the caller can finish an interrupted handler.
 * `courseCompleted` is then true when it was this lesson that completed the course.
 */
export async function applyLessonCompletion(
  actor: Actor,
  userUid: string,
  courseId: string,
  lessonId: string,
  totalLessonCount: number,
): Promise<{
  alreadyCompleted: boolean;
  effectsApplied: boolean;
  courseCompleted: boolean;
  enrollment: Enrollment;
}> {
  assertOwnLearning(actor, userUid, 'lesson.complete');
  const enrollmentRef = enrollmentDoc(userUid, courseId);
  const ref = progressDoc(userUid, courseId, lessonId);

  const outcome = await getAdminDb().runTransaction(async (tx) => {
    const enrollment = fromSnapshot<Enrollment>(await tx.get(enrollmentRef));
    const progress = fromSnapshotOrNull<LessonProgress>(await tx.get(ref));
    if (progress?.status === 'completed') {
      return {
        alreadyCompleted: true,
        effectsApplied: progress.effectsApplied,
        // Both dates were written by one commit, so they are the same instant.
        courseCompleted:
          enrollment.completedAt !== null && enrollment.completedAt === progress.completedAt,
      };
    }
    const lesson = fromSnapshot<Lesson>(await tx.get(lessonDoc(courseId, lessonId)), { courseId });

    const completedLessonIds = enrollment.completedLessonIds.includes(lessonId)
      ? enrollment.completedLessonIds
      : [...enrollment.completedLessonIds, lessonId];
    const { progressPercent, allLessonsDone } = lessonProgressOf(
      completedLessonIds.length,
      totalLessonCount,
    );
    // One-way: a course completed once stays completed, and is counted once.
    const courseCompleted = allLessonsDone && enrollment.completedAt === null;

    const completion = {
      status: 'completed' satisfies LessonProgress['status'],
      xpAwarded: lesson.xpReward,
      effectsApplied: false,
      completedAt: serverTimestamp(),
    };
    if (progress === null) {
      tx.create(ref, { ...newProgressFields(userUid, courseId), ...completion });
    } else {
      tx.update(ref, { ...completion, ...updatedNow() });
    }
    tx.update(enrollmentRef, {
      completedLessonIds,
      completedLessonCount: completedLessonIds.length,
      totalLessonCount,
      progressPercent,
      lastLessonId: lessonId,
      lastActivityAt: serverTimestamp(),
      ...(courseCompleted
        ? { status: 'completed' satisfies Enrollment['status'], completedAt: serverTimestamp() }
        : {}),
      ...updatedNow(),
    });
    if (courseCompleted) {
      tx.update(collections.users().doc(userUid), {
        'stats.coursesCompleted': FieldValue.increment(1),
        ...updatedNow(),
      });
    }
    return { alreadyCompleted: false, effectsApplied: false, courseCompleted };
  });

  return { ...outcome, enrollment: fromSnapshot<Enrollment>(await enrollmentRef.get()) };
}

export async function markLessonEffectsApplied(
  actor: Actor,
  userUid: string,
  courseId: string,
  lessonId: string,
): Promise<void> {
  assertSystem(actor);
  await updateExisting(progressDoc(userUid, courseId, lessonId), {
    effectsApplied: true,
    ...updatedNow(),
  });
}
