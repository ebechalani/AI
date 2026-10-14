import 'server-only';
import type { DocumentReference, Query } from 'firebase-admin/firestore';
import { assertSystem, isSystem, type Actor } from '@/lib/auth/actor';
import { assertCan, canViewLearnerRecord } from '@/lib/auth/authz';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { getAdminDb } from '@/lib/firebase/admin';
import { collections, docIds, quizKeyDoc } from '@/lib/firebase/collections';
import {
  createdNow,
  fromQuery,
  fromSnapshot,
  fromSnapshotOrNull,
  serverTimestamp,
  updatedNow,
} from '@/lib/firebase/converters';
import { CONTENT_LIMITS } from '@/lib/limits';
import { FORM_ERROR_KEY, parseInput } from '@/lib/schemas/common';
import { saveQuizInputSchema } from '@/lib/schemas/quiz';
import type { Locale, Localized, Page, PageRequest } from '@/types/common';
import type { QuizInput } from '@/types/inputs';
import type { Enrollment, QuizSummaryEntry } from '@/types/learning';
import type {
  Quiz,
  QuizAnswer,
  QuizAnswerKey,
  QuizAttempt,
  QuizQuestionResult,
  RevealAnswers,
} from '@/types/quiz';
import { quizDocumentBytes, splitQuizInput } from './course-derive';
import {
  assertCanReadClassRecords,
  assertCompositeId,
  assertId,
  assertNoEnrollments,
  assertTeachesAll,
  clampLimit,
  isMissingDocument,
  isSelf,
  isSelfOrAdmin,
  loadEditableCourse,
  loadViewableCourse,
  readPage,
  updateExisting,
} from './internal-content';

// --- Quiz definitions --------------------------------------------------------------------------

function quizDoc(courseId: string, quizId: string): DocumentReference {
  assertId(quizId);
  return collections.quizzes(courseId).doc(quizId);
}

/** The student-readable part. The answer key is another document and is never returned here. */
export async function getQuiz(actor: Actor, courseId: string, quizId: string): Promise<Quiz> {
  await loadViewableCourse(actor, courseId);
  return fromSnapshot<Quiz>(await quizDoc(courseId, quizId).get(), { courseId });
}

/** For the author (the quiz editor) and for grading, which runs as the system. */
export async function getQuizWithKey(
  actor: Actor,
  courseId: string,
  quizId: string,
): Promise<{ quiz: Quiz; key: QuizAnswerKey }> {
  await loadEditableCourse(actor, courseId);
  const [quizSnapshot, keySnapshot] = await getAdminDb().getAll(
    quizDoc(courseId, quizId),
    quizKeyDoc(courseId, quizId),
  );
  const quiz = fromSnapshot<Quiz>(quizSnapshot!, { courseId });
  const stored = keySnapshot!.data();
  if (stored === undefined) throw new NotFoundError(`${keySnapshot!.ref.path} does not exist.`);
  return {
    quiz,
    key: {
      answers: (stored.answers ?? {}) as QuizAnswerKey['answers'],
      explanations: (stored.explanations ?? {}) as QuizAnswerKey['explanations'],
    },
  };
}

/** Oldest first. */
export async function listQuizzes(actor: Actor, courseId: string): Promise<Quiz[]> {
  await loadViewableCourse(actor, courseId);
  const quizzes = fromQuery<Quiz>(await collections.quizzes(courseId).get(), { courseId });
  return quizzes.sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0,
  );
}

/**
 * Writes the quiz and its answer key together. Questions and options that arrive without an
 * id get one; the ones that have an id keep it, so stored attempts still point at them. The
 * reverse link `lessonId` belongs to the block transaction and is left alone.
 */
export async function saveQuiz(
  actor: Actor,
  courseId: string,
  quizId: string | null,
  input: QuizInput,
): Promise<Quiz> {
  await loadEditableCourse(actor, courseId);
  const parsed = parseInput(saveQuizInputSchema, { courseId, quizId, input });
  if (!parsed.success) throw new ValidationError('Invalid quiz.', parsed.fieldErrors);

  const quizzes = collections.quizzes(courseId);
  const { quiz, key } = splitQuizInput(parsed.data.input, () => quizzes.doc().id);
  if (quizDocumentBytes(quiz, key) > CONTENT_LIMITS.quizDocumentBytes) {
    throw new ValidationError('The quiz is too large to store.', {
      [FORM_ERROR_KEY]: ['too_long'],
    });
  }

  const batch = getAdminDb().batch();
  const ref = quizId === null ? quizzes.doc() : quizDoc(courseId, quizId);
  const keyRef = quizKeyDoc(courseId, ref.id);
  if (quizId === null) {
    batch.create(ref, { lessonId: null, ...quiz, ...createdNow() });
    batch.create(keyRef, { ...key, ...createdNow() });
  } else {
    batch.update(ref, { ...quiz, ...updatedNow() });
    // The two maps are replaced whole: a deleted question leaves no answer behind.
    batch.set(
      keyRef,
      { ...key, ...updatedNow() },
      { mergeFields: ['answers', 'explanations', 'updatedAt'] },
    );
  }
  try {
    await batch.commit();
  } catch (error) {
    if (isMissingDocument(error)) throw new NotFoundError(`${ref.path} does not exist.`);
    throw error;
  }
  return fromSnapshot<Quiz>(await ref.get(), { courseId });
}

export async function deleteQuiz(actor: Actor, courseId: string, quizId: string): Promise<void> {
  await loadEditableCourse(actor, courseId);
  const ref = quizDoc(courseId, quizId);
  await getAdminDb().runTransaction(async (tx) => {
    const quiz = fromSnapshot<Quiz>(await tx.get(ref), { courseId });
    if (quiz.lessonId !== null) {
      throw new ConflictError(`${ref.path} is used by a block of lesson ${quiz.lessonId}.`);
    }
    await assertNoEnrollments(tx, courseId);
    tx.delete(ref);
    tx.delete(quizKeyDoc(courseId, quizId));
  });
}

// --- Attempts ----------------------------------------------------------------------------------

/**
 * Built by services/assessment after grading. The repository adds what it reads in the
 * creating transaction: the attempt number, the class and school of the enrollment, the
 * quiz's lesson, title and XP.
 */
export interface NewQuizAttempt {
  userUid: string;
  courseId: string;
  quizId: string;
  /** Snapshot of the learner's display name. */
  studentName: string;
  locale: Locale;
  answers: Record<string, QuizAnswer>;
  results: Record<string, QuizQuestionResult>;
  score: number;
  maxScore: number;
  scorePercent: number;
  passed: boolean;
}

function attemptDoc(attemptId: string): DocumentReference {
  assertCompositeId(attemptId);
  return collections.quizAttempts().doc(attemptId);
}

function summaryOf(enrollment: Enrollment, quizId: string): QuizSummaryEntry | null {
  const summary = enrollment.quizSummary ?? {};
  return Object.hasOwn(summary, quizId) ? summary[quizId]! : null;
}

function titleSnapshot(translations: Quiz['translations']): Localized<{ title: string }> {
  return Object.fromEntries(
    Object.entries(translations).flatMap(([locale, entry]) =>
      entry ? [[locale, { title: entry.title }]] : [],
    ),
  );
}

/**
 * `results` gives the key away (one wrong true/false answer reveals the right one), so the
 * learner sees it only once the quiz's reveal rule is met for that attempt.
 */
export function isAttemptRevealed(
  attempt: Pick<QuizAttempt, 'passed'>,
  revealAnswers: RevealAnswers,
): boolean {
  return revealAnswers === 'after_attempt' || (revealAnswers === 'after_pass' && attempt.passed);
}

/** The student projection of 3.4: score, percent and `passed` always, `results` per the rule. */
export function toStudentAttempt(attempt: QuizAttempt, revealAnswers: RevealAnswers): QuizAttempt {
  return isAttemptRevealed(attempt, revealAnswers) ? attempt : { ...attempt, results: null };
}

// What the actor receives of one attempt: its owner gets the student projection, which costs
// the quiz document; staff get all of it.
async function forViewer(actor: Actor, attempt: QuizAttempt): Promise<QuizAttempt> {
  if (!isSelf(actor, attempt.userUid)) return attempt;
  const quiz = await quizDoc(attempt.courseId, attempt.quizId).get();
  const revealAnswers = (quiz.get('revealAnswers') ?? 'never') as RevealAnswers;
  return toStudentAttempt(attempt, revealAnswers);
}

// In lists the owner never gets `results`: applying the reveal rule would cost a quiz read
// per row, and no list shows answers.
function forViewerInList(actor: Actor, attempts: QuizAttempt[]): QuizAttempt[] {
  return attempts.map((attempt) =>
    isSelf(actor, attempt.userUid) ? { ...attempt, results: null } : attempt,
  );
}

/**
 * Numbers the attempt, enforces `quiz.maxAttempts` and updates `quizSummary` in one
 * transaction. Of two submissions sent at the same moment only one is stored: both expect
 * the same attempt number, and the one that finds it taken fails with ConflictError instead
 * of becoming a second attempt with the same answers.
 */
export async function createAttempt(actor: Actor, input: NewQuizAttempt): Promise<QuizAttempt> {
  assertSystem(actor);
  const { userUid, courseId, quizId } = input;
  assertId(userUid);
  assertId(courseId);
  const quizRef = quizDoc(courseId, quizId);
  const enrollmentRef = collections.enrollments().doc(docIds.enrollment(userUid, courseId));
  const attemptsOf = (enrollment: Enrollment) => summaryOf(enrollment, quizId)?.attempts ?? 0;
  const expected = attemptsOf(fromSnapshot<Enrollment>(await enrollmentRef.get()));

  const attemptId = await getAdminDb().runTransaction(async (tx) => {
    const enrollment = fromSnapshot<Enrollment>(await tx.get(enrollmentRef));
    const quiz = fromSnapshot<Quiz>(await tx.get(quizRef), { courseId });
    const previous = summaryOf(enrollment, quizId);
    const attempts = attemptsOf(enrollment);
    if (attempts !== expected) {
      throw new ConflictError(`Another attempt at quiz ${quizId} was submitted at the same time.`);
    }
    if (quiz.maxAttempts !== null && attempts >= quiz.maxAttempts) {
      throw new ConflictError(`No attempt is left for quiz ${quizId}.`);
    }

    const attemptNumber = attempts + 1;
    const firstPass = input.passed && previous?.passed !== true;
    const ref = collections
      .quizAttempts()
      .doc(docIds.quizAttempt(userUid, courseId, quizId, attemptNumber));
    tx.create(ref, {
      userUid,
      courseId,
      quizId,
      lessonId: quiz.lessonId,
      studentName: input.studentName,
      quizTitle: titleSnapshot(quiz.translations),
      schoolId: enrollment.schoolId,
      classId: enrollment.classId,
      attemptNumber,
      locale: input.locale,
      answers: input.answers,
      results: input.results,
      score: input.score,
      maxScore: input.maxScore,
      scorePercent: input.scorePercent,
      passed: input.passed,
      // The quiz's XP is granted once, for the first passed attempt (9.1).
      xpAwarded: firstPass ? quiz.xpReward : 0,
      // Every passed attempt waits for onQuizPassed, which is idempotent (9.4).
      effectsApplied: !input.passed,
      submittedAt: serverTimestamp(),
      ...createdNow(),
    });
    tx.update(enrollmentRef, {
      [`quizSummary.${quizId}`]: {
        attempts: attemptNumber,
        passed: input.passed || previous?.passed === true,
        bestPercent: Math.max(input.scorePercent, previous?.bestPercent ?? 0),
        lastPercent: input.scorePercent,
      } satisfies QuizSummaryEntry,
      lastActivityAt: serverTimestamp(),
      ...updatedNow(),
    });
    return ref.id;
  });
  return fromSnapshot<QuizAttempt>(await attemptDoc(attemptId).get());
}

export async function getAttempt(actor: Actor, attemptId: string): Promise<QuizAttempt> {
  const attempt = fromSnapshot<QuizAttempt>(await attemptDoc(attemptId).get());
  assertCan(canViewLearnerRecord(actor, attempt), 'attempt.view');
  return forViewer(actor, attempt);
}

/** Two direct reads: the enrollment for the number of attempts, then that attempt. */
export async function getLatestAttempt(
  actor: Actor,
  userUid: string,
  courseId: string,
  quizId: string,
): Promise<QuizAttempt | null> {
  assertId(userUid);
  assertId(courseId);
  assertId(quizId);
  const enrollment = fromSnapshotOrNull<Enrollment>(
    await collections.enrollments().doc(docIds.enrollment(userUid, courseId)).get(),
  );
  const attempts = enrollment === null ? 0 : (summaryOf(enrollment, quizId)?.attempts ?? 0);
  if (enrollment === null || attempts === 0) {
    // Nothing to return; "nothing" is still an answer about that learner.
    const record = enrollment ?? { userUid, schoolId: null, classId: null };
    assertCan(canViewLearnerRecord(actor, record), 'attempt.view');
    return null;
  }
  const attempt = fromSnapshotOrNull<QuizAttempt>(
    await attemptDoc(docIds.quizAttempt(userUid, courseId, quizId, attempts)).get(),
  );
  assertCan(canViewLearnerRecord(actor, attempt ?? enrollment), 'attempt.view');
  return attempt === null ? null : forViewer(actor, attempt);
}

/**
 * Newest first. The learner sees all their attempts. A teacher must name a class they teach
 * and sees the attempts made in it; a school admin sees those of their school.
 */
export async function listRecentAttemptsForUser(
  actor: Actor,
  userUid: string,
  opts: { limit: number; classId?: string },
): Promise<QuizAttempt[]> {
  assertId(userUid);
  const limit = clampLimit(opts.limit);
  const attempts = collections.quizAttempts();
  const all = attempts.where('userUid', '==', userUid).orderBy('submittedAt', 'desc');
  const inClass = (classId: string) =>
    attempts
      .where('classId', '==', classId)
      .where('userUid', '==', userUid)
      .orderBy('submittedAt', 'desc');

  let query: Query;
  let filterInMemory = false;
  if (isSelf(actor, userUid)) {
    query = all;
  } else if (isSelfOrAdmin(actor, userUid)) {
    query = opts.classId === undefined ? all : inClass(checkedClassId(opts.classId));
  } else if (!isSystem(actor) && actor.role === 'teacher') {
    if (opts.classId === undefined) throw new ForbiddenError('A teacher lists attempts per class.');
    await assertCanReadClassRecords(actor, opts.classId);
    query = inClass(opts.classId);
  } else if (!isSystem(actor) && actor.role === 'school_admin') {
    query = opts.classId === undefined ? all : inClass(checkedClassId(opts.classId));
    filterInMemory = true;
  } else {
    throw new ForbiddenError('attempts.list');
  }

  if (!filterInMemory) {
    return forViewerInList(actor, fromQuery<QuizAttempt>(await query.limit(limit).get()));
  }
  const newest = fromQuery<QuizAttempt>(await query.limit(FILTERED_READ_LIMIT).get());
  return newest.filter((attempt) => canViewLearnerRecord(actor, attempt)).slice(0, limit);
}

// How far back a list that is filtered in memory looks.
const FILTERED_READ_LIMIT = 200;

function checkedClassId(classId: string): string {
  assertId(classId);
  return classId;
}

/** Newest first, 50 per page; with `courseId`, the attempts at that course's quizzes only. */
export async function listAttemptsForClass(
  actor: Actor,
  classId: string,
  opts?: { courseId?: string; page?: PageRequest },
): Promise<Page<QuizAttempt>> {
  await assertCanReadClassRecords(actor, classId);
  const courseId = opts?.courseId;
  let query = collections.quizAttempts().where('classId', '==', classId);
  if (courseId !== undefined) {
    assertId(courseId);
    query = query.where('courseId', '==', courseId);
  }
  return readPage<QuizAttempt>(
    query.orderBy('submittedAt', 'desc'),
    collections.quizAttempts(),
    opts?.page,
    (data) => data.classId === classId && (courseId === undefined || data.courseId === courseId),
  );
}

/** The newest attempts across the classes the actor teaches; no query at all for no class. */
export async function listAttemptsForClasses(
  actor: Actor,
  classIds: string[],
  limit: number,
): Promise<QuizAttempt[]> {
  const taught = assertTeachesAll(actor, classIds);
  if (taught.length === 0) return [];
  const snapshot = await collections
    .quizAttempts()
    .where('classId', 'in', taught)
    .orderBy('submittedAt', 'desc')
    .limit(clampLimit(limit))
    .get();
  return fromQuery<QuizAttempt>(snapshot);
}

export async function markAttemptEffectsApplied(actor: Actor, attemptId: string): Promise<void> {
  assertSystem(actor);
  await updateExisting(attemptDoc(attemptId), { effectsApplied: true, ...updatedNow() });
}
