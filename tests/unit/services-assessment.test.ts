import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SYSTEM_ACTOR } from '@/lib/auth/actor';
import { getCourse } from '@/lib/data/courses';
import { getEnrollment } from '@/lib/data/enrollments';
import { createAttempt, getQuizWithKey } from '@/lib/data/quizzes';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { onQuizPassed } from '@/lib/gamification/events';
import { getCourseAccess } from '@/lib/services/access';
import { submitQuizAttempt } from '@/lib/services/assessment';
import type { QuizAnswerKey } from '@/types';
import { attempt, course, enrollment, outcome, quiz, session } from './services-fixtures';

// services/assessment over mocked repositories, with the real gradeQuiz: who may attempt,
// what is stored, what the learner gets back (the student projection and the reveal rule) and
// when the quiz's XP handler runs.

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(() => {
    throw new Error('Firestore was reached.');
  }),
}));
vi.mock('@/lib/data/courses', () => ({ getCourse: vi.fn() }));
vi.mock('@/lib/data/enrollments', () => ({ getEnrollment: vi.fn() }));
vi.mock('@/lib/data/quizzes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/data/quizzes')>()),
  createAttempt: vi.fn(),
  getQuizWithKey: vi.fn(),
}));
vi.mock('@/lib/gamification/events', () => ({ onQuizPassed: vi.fn() }));
vi.mock('@/lib/services/access', () => ({ getCourseAccess: vi.fn() }));

const student = session('student', 'student-1', 'school-a', ['class-a']);
const teacher = session('teacher', 'teacher-1', 'school-a');

const twoQuestions = quiz({
  id: 'quiz-1',
  courseId: 'course-1',
  maxAttempts: 3,
  questionCount: 2,
  questions: [
    {
      id: 'q1',
      type: 'multiple_choice',
      points: 10,
      translations: { en: { prompt: 'Pick one' } },
      options: [
        { id: 'o1', translations: { en: { text: 'Right' } } },
        { id: 'o2', translations: { en: { text: 'Wrong' } } },
      ],
    },
    {
      id: 'q2',
      type: 'short_answer',
      points: 10,
      translations: { en: { prompt: 'Name it' } },
      options: [],
    },
  ],
});
const key: QuizAnswerKey = {
  answers: {
    q1: { correctOptionIds: ['o1'], acceptedAnswers: {} },
    q2: { correctOptionIds: [], acceptedAnswers: { en: ['Robot'], fr: ['Robot'] } },
  },
  explanations: {
    q1: { en: { text: 'Because.' }, fr: { text: 'Parce que.' } },
    q2: { en: { text: '   ' } },
  },
};

const right = {
  q1: { selectedOptionIds: ['o1'], text: null },
  q2: { selectedOptionIds: [], text: 'robot' },
};
const wrong = {
  q1: { selectedOptionIds: ['o2'], text: null },
  q2: { selectedOptionIds: [], text: 'cat' },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(getCourse).mockResolvedValue(course({ id: 'course-1' }));
  vi.mocked(getCourseAccess).mockResolvedValue({ allowed: true, via: 'free' });
  vi.mocked(getEnrollment).mockResolvedValue(
    enrollment({ userUid: 'student-1', courseId: 'course-1', classId: 'class-a' }),
  );
  vi.mocked(getQuizWithKey).mockResolvedValue({ quiz: twoQuestions, key });
  vi.mocked(createAttempt).mockImplementation(async (_actor, input) =>
    attempt({
      ...input,
      attemptNumber: 1,
      id: `${input.userUid}_${input.courseId}_${input.quizId}_1`,
      xpAwarded: input.passed ? 100 : 0,
      effectsApplied: !input.passed,
    }),
  );
  vi.mocked(onQuizPassed).mockResolvedValue(outcome({ xpAwarded: 100 }));
});

describe('submitQuizAttempt', () => {
  it('grades against the key read as the system and stores the attempt under the learner', async () => {
    const result = await submitQuizAttempt(student, {
      courseId: 'course-1',
      quizId: 'quiz-1',
      answers: right,
      locale: 'fr',
    });
    expect(getQuizWithKey).toHaveBeenCalledWith(SYSTEM_ACTOR, 'course-1', 'quiz-1');
    expect(createAttempt).toHaveBeenCalledWith(SYSTEM_ACTOR, {
      userUid: 'student-1',
      courseId: 'course-1',
      quizId: 'quiz-1',
      studentName: 'Name of student-1',
      locale: 'fr',
      answers: right,
      results: {
        q1: { correct: true, pointsAwarded: 10 },
        q2: { correct: true, pointsAwarded: 10 },
      },
      score: 20,
      maxScore: 20,
      scorePercent: 100,
      passed: true,
    });
    expect(result.attempt.passed).toBe(true);
    expect(result.attemptsRemaining).toBe(2);
  });

  it('runs the quiz handler for a passed attempt and returns its outcome', async () => {
    const result = await submitQuizAttempt(student, {
      courseId: 'course-1',
      quizId: 'quiz-1',
      answers: right,
      locale: 'en',
    });
    expect(onQuizPassed).toHaveBeenCalledWith('student-1', {
      attemptId: 'student-1_course-1_quiz-1_1',
      courseId: 'course-1',
      quizId: 'quiz-1',
      xpReward: 100,
    });
    expect(result.gamification).toEqual(outcome({ xpAwarded: 100 }));

    vi.mocked(onQuizPassed).mockRejectedValueOnce(new Error('ledger down'));
    const unsettled = await submitQuizAttempt(student, {
      courseId: 'course-1',
      quizId: 'quiz-1',
      answers: right,
      locale: 'en',
    });
    expect(unsettled.attempt.passed).toBe(true);
    expect(unsettled.gamification).toBeNull();
  });

  it('applies the reveal rule: after_pass hides the key from a failed attempt', async () => {
    const failed = await submitQuizAttempt(student, {
      courseId: 'course-1',
      quizId: 'quiz-1',
      answers: wrong,
      locale: 'en',
    });
    expect(failed.attempt.passed).toBe(false);
    expect(failed.attempt.scorePercent).toBe(0);
    expect(failed.attempt.results).toBeNull();
    expect(failed.correctOptionIds).toBeNull();
    expect(failed.explanations).toBeNull();
    expect(failed.gamification).toBeNull();
    expect(onQuizPassed).not.toHaveBeenCalled();

    const passed = await submitQuizAttempt(student, {
      courseId: 'course-1',
      quizId: 'quiz-1',
      answers: right,
      locale: 'fr',
    });
    expect(passed.attempt.results).not.toBeNull();
    expect(passed.correctOptionIds).toEqual({ q1: ['o1'], q2: [] });
    // Resolved to the attempt's locale; a blank explanation is left out.
    expect(passed.explanations).toEqual({ q1: 'Parce que.' });
  });

  it('reveals after every attempt when the quiz says so, and never when it says never', async () => {
    vi.mocked(getQuizWithKey).mockResolvedValue({
      quiz: { ...twoQuestions, revealAnswers: 'after_attempt' },
      key,
    });
    const failed = await submitQuizAttempt(student, {
      courseId: 'course-1',
      quizId: 'quiz-1',
      answers: wrong,
      locale: 'en',
    });
    expect(failed.attempt.results).toEqual({
      q1: { correct: false, pointsAwarded: 0 },
      q2: { correct: false, pointsAwarded: 0 },
    });
    expect(failed.correctOptionIds).toEqual({ q1: ['o1'], q2: [] });

    vi.mocked(getQuizWithKey).mockResolvedValue({
      quiz: { ...twoQuestions, revealAnswers: 'never', maxAttempts: null },
      key,
    });
    const passed = await submitQuizAttempt(student, {
      courseId: 'course-1',
      quizId: 'quiz-1',
      answers: right,
      locale: 'en',
    });
    expect(passed.attempt.results).toBeNull();
    expect(passed.correctOptionIds).toBeNull();
    expect(passed.attemptsRemaining).toBeNull();
  });

  it('drops answers to questions the quiz does not have', async () => {
    await submitQuizAttempt(student, {
      courseId: 'course-1',
      quizId: 'quiz-1',
      answers: { ...right, q9: { selectedOptionIds: ['o1'], text: null } },
      locale: 'en',
    });
    expect(createAttempt).toHaveBeenCalledWith(
      SYSTEM_ACTOR,
      expect.objectContaining({ answers: right }),
    );
  });

  it('requires an enrollment, a learner of the course and a well-formed input', async () => {
    vi.mocked(getEnrollment).mockResolvedValueOnce(null);
    await expect(
      submitQuizAttempt(student, {
        courseId: 'course-1',
        quizId: 'quiz-1',
        answers: right,
        locale: 'en',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    vi.mocked(getEnrollment).mockResolvedValueOnce(
      enrollment({ userUid: 'teacher-1', courseId: 'course-1' }),
    );
    await expect(
      submitQuizAttempt(teacher, {
        courseId: 'course-1',
        quizId: 'quiz-1',
        answers: right,
        locale: 'en',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    await expect(
      submitQuizAttempt(SYSTEM_ACTOR, {
        courseId: 'course-1',
        quizId: 'quiz-1',
        answers: right,
        locale: 'en',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    await expect(
      submitQuizAttempt(student, {
        courseId: 'course-1',
        quizId: 'quiz 1',
        answers: right,
        locale: 'en',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(createAttempt).not.toHaveBeenCalled();
    expect(getQuizWithKey).not.toHaveBeenCalled();
  });

  it('maps a hidden course to not found before touching the key', async () => {
    vi.mocked(getCourseAccess).mockResolvedValueOnce({ allowed: false, reason: 'not_visible' });
    await expect(
      submitQuizAttempt(student, {
        courseId: 'course-1',
        quizId: 'quiz-1',
        answers: right,
        locale: 'en',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(getQuizWithKey).not.toHaveBeenCalled();
  });
});
