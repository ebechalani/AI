import 'server-only';
import { cache } from 'react';
import { SYSTEM_ACTOR, type Actor, type Session } from '@/lib/auth/actor';
import { getCourse, getCourseOutline, getLesson, listBlocks } from '@/lib/data/courses';
import {
  applyLessonCompletion,
  createEnrollment,
  getEnrollment,
  getLessonProgress,
  markLessonStarted,
  saveBlockResponse,
} from '@/lib/data/enrollments';
import { getProject } from '@/lib/data/projects';
import { getLatestAttempt, getQuiz } from '@/lib/data/quizzes';
import { getSchool } from '@/lib/data/schools';
import { getSubmission } from '@/lib/data/submissions';
import { ConflictError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { onLessonCompleted, onQuizPassed } from '@/lib/gamification/events';
import { getMissingForCompletion, isReadyForCompletion } from '@/lib/learning/lesson-completion';
import type { Course, Lesson } from '@/types/content';
import type {
  Enrollment,
  LessonCompletionResult,
  LessonPlayerData,
  LessonProgress,
} from '@/types/learning';
import type { Project, Submission } from '@/types/project';
import type { Quiz, QuizAttempt } from '@/types/quiz';
import { resolveClassContext } from './classroom';
import {
  applyEffects,
  learnerAudience,
  orNullIfMissing,
  own,
  requireCourseAccess,
  requireLearnerSession,
  requireSessionActor,
} from './internal-common';

// Enrolling and the lesson player (ARCHITECTURE.md 10.3, 7.6, 9.4). Learning happens in the
// actor's own name: a student learns in a student course they are enrolled in, a teacher in a
// Teacher Academy course; everyone else reads the player read-only.

// The course outline is read once per request (3.7): the course page and the player share it.
const loadOutline = cache((actor: Actor, courseId: string) => getCourseOutline(actor, courseId));

/** Whether this enrollment makes the actor a learner of the course, rather than a visitor. */
function learns(session: Session, course: Course, enrollment: Enrollment | null): boolean {
  return enrollment !== null && learnerAudience(session.role) === course.audience;
}

// Both dates were written by one commit, so they name the same instant when the lesson was the
// one that completed the course (data/enrollments.applyLessonCompletion).
function completedTheCourse(enrollment: Enrollment, progress: LessonProgress): boolean {
  return enrollment.completedAt !== null && enrollment.completedAt === progress.completedAt;
}

function nothingMissing(): LessonCompletionResult['missing'] {
  return { quizIds: [], projectIds: [], reflectionBlockIds: [] };
}

// --- Enrolling ---------------------------------------------------------------------------------

/**
 * Enrols the actor in a published course they may open: a student in a student course, a
 * teacher in a Teacher Academy course. The supervising class of a student's enrollment is
 * resolved by classroom.resolveClassContext; a teacher's enrollment is never supervised.
 * Idempotent: an existing enrollment is returned as it is.
 */
export async function enrollSelf(actor: Actor, courseId: string): Promise<Enrollment> {
  const session = requireLearnerSession(actor, 'course.enroll');
  const course = await getCourse(actor, courseId);
  await requireCourseAccess(actor, course);
  if (course.audience !== learnerAudience(session.role)) {
    throw new ForbiddenError(`courses/${courseId} is not for ${session.role}s.`);
  }
  // An enrollment freezes the course's structure (3.1), so a draft cannot be learned yet.
  if (course.status !== 'published') {
    throw new ConflictError(`courses/${courseId} is not published.`);
  }

  const context =
    session.role === 'student'
      ? await resolveClassContext(session.uid, courseId)
      : { classId: null, schoolId: session.schoolId };
  return createEnrollment(SYSTEM_ACTOR, {
    userUid: session.uid,
    courseId,
    classId: context.classId,
    schoolId: context.schoolId,
    source: 'self',
    totalLessonCount: course.lessonCount,
  });
}

// --- The lesson player -------------------------------------------------------------------------

interface QuizSlot {
  quiz: Quiz;
  attempt: QuizAttempt | null;
  attemptsRemaining: number | null;
}

/**
 * One quiz of the lesson with the learner's latest attempt (student projection) and, when a
 * passed attempt still waits for its XP, the repaired attempt (9.4).
 */
async function loadQuizSlot(
  actor: Actor,
  session: Session,
  courseId: string,
  quizId: string,
  enrollment: Enrollment | null,
  learner: boolean,
): Promise<QuizSlot> {
  const attempts = enrollment === null ? 0 : (own(enrollment.quizSummary, quizId)?.attempts ?? 0);
  const [quiz, latest] = await Promise.all([
    getQuiz(actor, courseId, quizId),
    attempts > 0 ? getLatestAttempt(actor, session.uid, courseId, quizId) : null,
  ]);

  let attempt = latest;
  if (learner && attempt !== null && attempt.passed && !attempt.effectsApplied) {
    const outcome = await applyEffects('onQuizPassed', () =>
      onQuizPassed(session.uid, {
        attemptId: attempt!.id,
        courseId,
        quizId,
        xpReward: quiz.xpReward,
      }),
    );
    if (outcome !== null) attempt = { ...attempt, effectsApplied: true };
  }
  return {
    quiz,
    attempt,
    attemptsRemaining: quiz.maxAttempts === null ? null : Math.max(0, quiz.maxAttempts - attempts),
  };
}

async function loadProjectSlot(
  actor: Actor,
  courseId: string,
  projectId: string,
  enrollment: Enrollment | null,
): Promise<{ project: Project; submission: Submission | null }> {
  const latestId =
    enrollment === null
      ? null
      : (own(enrollment.projectSummary, projectId)?.latestSubmissionId ?? null);
  const [project, submission] = await Promise.all([
    getProject(actor, courseId, projectId),
    latestId === null ? null : orNullIfMissing(getSubmission(actor, latestId)),
  ]);
  return { project, submission };
}

/** The school switch `settings.aiEnabled`; a user without a school is not switched off. */
async function schoolAllowsAi(actor: Actor, schoolId: string | null): Promise<boolean> {
  if (schoolId === null) return true;
  const school = await orNullIfMissing(getSchool(actor, schoolId));
  return school?.settings.aiEnabled === true;
}

/**
 * Everything the lesson player renders (7.6). The server decides `readOnly`: a student learns
 * when enrolled, a teacher only in a Teacher Academy course they are enrolled in; school and
 * platform admins, and anyone not enrolled, get the read-only preview. A completed lesson or a
 * passed attempt whose gamification effects are still pending is repaired on the way (9.4).
 */
export async function getLessonPlayerData(
  actor: Actor,
  courseId: string,
  lessonId: string,
): Promise<LessonPlayerData> {
  const session = requireSessionActor(actor, 'lesson.view');
  const { course, modules, lessons } = await loadOutline(actor, courseId);
  await requireCourseAccess(actor, course);
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  const lesson = lessons[index];
  if (lesson === undefined) {
    throw new NotFoundError(`courses/${courseId}/lessons/${lessonId} does not exist.`);
  }

  const [blocks, enrollment] = await Promise.all([
    listBlocks(actor, courseId, lessonId),
    getEnrollment(actor, session.uid, courseId),
  ]);
  const learner = learns(session, course, enrollment);

  let progress =
    enrollment === null ? null : await getLessonProgress(actor, session.uid, courseId, lessonId);
  if (
    learner &&
    enrollment !== null &&
    progress?.status === 'completed' &&
    !progress.effectsApplied
  ) {
    const outcome = await applyEffects('onLessonCompleted', () =>
      onLessonCompleted(session.uid, {
        courseId,
        lessonId,
        xpReward: lesson.xpReward,
        courseCompleted: completedTheCourse(enrollment, progress!),
      }),
    );
    if (outcome !== null) progress = { ...progress, effectsApplied: true };
  }

  const [quizSlots, projectSlots, tutorEnabled] = await Promise.all([
    Promise.all(
      lesson.quizIds.map((quizId) =>
        loadQuizSlot(actor, session, courseId, quizId, enrollment, learner),
      ),
    ),
    Promise.all(
      lesson.projectIds.map((projectId) => loadProjectSlot(actor, courseId, projectId, enrollment)),
    ),
    learner ? schoolAllowsAi(actor, session.schoolId) : false,
  ]);

  return {
    course,
    modules,
    lessons,
    lesson,
    blocks,
    enrollment,
    progress,
    quizzes: Object.fromEntries(quizSlots.map((slot) => [slot.quiz.id, slot.quiz])),
    latestAttempts: Object.fromEntries(quizSlots.map((slot) => [slot.quiz.id, slot.attempt])),
    attemptsRemaining: Object.fromEntries(
      quizSlots.map((slot) => [slot.quiz.id, slot.attemptsRemaining]),
    ),
    projects: Object.fromEntries(projectSlots.map((slot) => [slot.project.id, slot.project])),
    latestSubmissions: Object.fromEntries(
      projectSlots.map((slot) => [slot.project.id, slot.submission]),
    ),
    previousLessonId: lessons[index - 1]?.id ?? null,
    nextLessonId: lessons[index + 1]?.id ?? null,
    readOnly: !learner,
    tutorEnabled,
  };
}

// --- Learning ----------------------------------------------------------------------------------

/** First visit of a lesson: the progress document, and the enrollment's "continue" target. */
export async function startLesson(actor: Actor, courseId: string, lessonId: string): Promise<void> {
  const session = requireLearnerSession(actor, 'lesson.start');
  await markLessonStarted(actor, session.uid, courseId, lessonId);
}

/** A reflection or code-activity response; a block of any other type takes none. */
export async function saveResponse(
  actor: Actor,
  courseId: string,
  lessonId: string,
  blockId: string,
  text: string,
): Promise<void> {
  const session = requireLearnerSession(actor, 'lesson.respond');
  const blocks = await listBlocks(actor, courseId, lessonId);
  const block = blocks.find((candidate) => candidate.id === blockId);
  if (block === undefined || (block.type !== 'reflection' && block.type !== 'code_activity')) {
    throw new NotFoundError(`Lesson ${lessonId} has no block ${blockId} that takes a response.`);
  }
  await saveBlockResponse(actor, session.uid, courseId, lessonId, blockId, text);
}

/** The rule of 9.4 from the enrollment and the progress document; no attempt or submission query. */
async function missingForCompletion(
  actor: Actor,
  lesson: Lesson,
  enrollment: Enrollment,
  progress: LessonProgress | null,
): Promise<LessonCompletionResult['missing']> {
  // A passed quiz is settled whatever its attempt limit; only the others need their definition.
  const unsettled = lesson.quizIds.filter(
    (quizId) => own(enrollment.quizSummary, quizId)?.passed !== true,
  );
  const [quizzes, blocks] = await Promise.all([
    Promise.all(
      unsettled.map(
        async (quizId) => [quizId, await getQuiz(actor, lesson.courseId, quizId)] as const,
      ),
    ),
    lesson.reflectionBlockIds.length > 0 ? listBlocks(actor, lesson.courseId, lesson.id) : [],
  ]);
  return getMissingForCompletion({
    lesson,
    blocks,
    quizzes: Object.fromEntries(quizzes),
    enrollment,
    responses: progress?.responses ?? {},
  });
}

/**
 * Checks the lesson's requirements (9.4), completes it in one transaction and awards what it
 * earns. Completing a completed lesson again changes nothing, except that effects still
 * pending from an interrupted run are applied then.
 */
export async function completeLesson(
  actor: Actor,
  courseId: string,
  lessonId: string,
): Promise<LessonCompletionResult> {
  const session = requireLearnerSession(actor, 'lesson.complete');
  const [course, lesson, enrollment] = await Promise.all([
    getCourse(actor, courseId),
    getLesson(actor, courseId, lessonId),
    getEnrollment(actor, session.uid, courseId),
  ]);
  if (enrollment === null) {
    throw new NotFoundError(`users/${session.uid} is not enrolled in courses/${courseId}.`);
  }
  await requireCourseAccess(actor, course);
  if (!learns(session, course, enrollment)) throw new ForbiddenError('lesson.complete');

  const progress = await getLessonProgress(actor, session.uid, courseId, lessonId);
  if (progress?.status !== 'completed') {
    const missing = await missingForCompletion(actor, lesson, enrollment, progress);
    if (!isReadyForCompletion(missing)) {
      return { completed: false, missing, enrollment, gamification: null };
    }
  }

  const result = await applyLessonCompletion(
    actor,
    session.uid,
    courseId,
    lessonId,
    course.lessonCount,
  );
  const gamification = result.effectsApplied
    ? null
    : await applyEffects('onLessonCompleted', () =>
        onLessonCompleted(session.uid, {
          courseId,
          lessonId,
          xpReward: lesson.xpReward,
          courseCompleted: result.courseCompleted,
        }),
      );
  return {
    completed: true,
    missing: nothingMissing(),
    enrollment: result.enrollment,
    gamification,
  };
}
