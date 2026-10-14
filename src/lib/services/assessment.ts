import 'server-only';
import { SYSTEM_ACTOR, type Actor } from '@/lib/auth/actor';
import { getCourse } from '@/lib/data/courses';
import { getEnrollment } from '@/lib/data/enrollments';
import {
  createAttempt,
  getQuizWithKey,
  isAttemptRevealed,
  toStudentAttempt,
} from '@/lib/data/quizzes';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { onQuizPassed } from '@/lib/gamification/events';
import { pickTranslation } from '@/lib/i18n/content';
import { gradeQuiz } from '@/lib/learning/quiz-grading';
import { parseInput } from '@/lib/schemas/common';
import { submitQuizAttemptInputSchema } from '@/lib/schemas/quiz';
import type { Locale } from '@/types/common';
import type { Quiz, QuizAnswer, QuizAnswerKey, QuizAttemptResult } from '@/types/quiz';
import {
  applyEffects,
  learnerAudience,
  own,
  requireCourseAccess,
  requireLearnerSession,
} from './internal-common';

// Quiz attempts (ARCHITECTURE.md 10.3, 3.4): graded on the server against the answer key,
// which never leaves it; the learner receives the student projection.

/** The answers to the quiz's own questions, in the order of the quiz; anything else is dropped. */
function answersToQuestions(
  quiz: Quiz,
  answers: Record<string, QuizAnswer>,
): Record<string, QuizAnswer> {
  const kept: Record<string, QuizAnswer> = {};
  for (const question of quiz.questions) {
    const answer = own(answers, question.id);
    if (answer !== undefined) kept[question.id] = answer;
  }
  return kept;
}

function correctOptionIdsOf(quiz: Quiz, key: QuizAnswerKey): Record<string, string[]> {
  return Object.fromEntries(
    quiz.questions.map((question) => [
      question.id,
      own(key.answers, question.id)?.correctOptionIds ?? [],
    ]),
  );
}

/** The explanations that exist, resolved to the attempt's locale. */
function explanationsOf(quiz: Quiz, key: QuizAnswerKey, locale: Locale): Record<string, string> {
  const explanations: Record<string, string> = {};
  for (const question of quiz.questions) {
    const entry = own(key.explanations, question.id);
    if (entry === undefined) continue;
    const text = pickTranslation(entry, locale, quiz.defaultLocale).text;
    if (typeof text === 'string' && text.trim() !== '') explanations[question.id] = text;
  }
  return explanations;
}

/**
 * Grades and records one attempt. The learner must be enrolled and allowed to open the course;
 * the repository numbers the attempt and enforces `maxAttempts`. A passed attempt awards the
 * quiz's XP once (a repeat pass earns nothing and still settles the attempt). The answer key is
 * shown only as far as the quiz's reveal rule allows.
 */
export async function submitQuizAttempt(
  actor: Actor,
  input: { courseId: string; quizId: string; answers: Record<string, QuizAnswer>; locale: Locale },
): Promise<QuizAttemptResult> {
  const session = requireLearnerSession(actor, 'quiz.attempt');
  const parsed = parseInput(submitQuizAttemptInputSchema, {
    courseId: input.courseId,
    quizId: input.quizId,
    answers: input.answers,
  });
  if (!parsed.success) throw new ValidationError('Invalid quiz attempt.', parsed.fieldErrors);
  const { courseId, quizId } = parsed.data;
  const { locale } = input;

  const [course, enrollment] = await Promise.all([
    getCourse(actor, courseId),
    getEnrollment(actor, session.uid, courseId),
  ]);
  if (enrollment === null) {
    throw new NotFoundError(`users/${session.uid} is not enrolled in courses/${courseId}.`);
  }
  await requireCourseAccess(actor, course);
  if (course.audience !== learnerAudience(session.role)) throw new ForbiddenError('quiz.attempt');

  // The key is read as the system: a learner may never read it, and this is the one place it
  // is used on their behalf.
  const { quiz, key } = await getQuizWithKey(SYSTEM_ACTOR, courseId, quizId);
  const answers = answersToQuestions(quiz, parsed.data.answers);
  const grade = gradeQuiz(quiz, key, answers, locale);
  const attempt = await createAttempt(SYSTEM_ACTOR, {
    userUid: session.uid,
    courseId,
    quizId,
    studentName: session.displayName,
    locale,
    answers,
    results: grade.results,
    score: grade.score,
    maxScore: grade.maxScore,
    scorePercent: grade.scorePercent,
    passed: grade.passed,
  });

  const gamification = attempt.passed
    ? await applyEffects('onQuizPassed', () =>
        onQuizPassed(session.uid, {
          attemptId: attempt.id,
          courseId,
          quizId,
          xpReward: quiz.xpReward,
        }),
      )
    : null;

  const revealed = isAttemptRevealed(attempt, quiz.revealAnswers);
  return {
    attempt: toStudentAttempt(attempt, quiz.revealAnswers),
    correctOptionIds: revealed ? correctOptionIdsOf(quiz, key) : null,
    explanations: revealed ? explanationsOf(quiz, key, locale) : null,
    attemptsRemaining:
      quiz.maxAttempts === null ? null : Math.max(0, quiz.maxAttempts - attempt.attemptNumber),
    gamification,
  };
}
