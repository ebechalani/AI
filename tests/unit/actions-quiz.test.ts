import { revalidatePath } from 'next/cache';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { submitQuizAttemptAction } from '@/actions/quiz';
import { assertSessionNotRevoked, getSession } from '@/lib/actions/session-source';
import {
  ConflictError,
  ForbiddenError,
  LicenseRequiredError,
  NotFoundError,
  ValidationError,
} from '@/lib/errors';
import { submitQuizAttempt } from '@/lib/services/assessment';
import type { QuizAttemptResult, Role, SubmitQuizAttemptInput } from '@/types';
import { attempt, outcome, session as sessionOf } from './services-fixtures';

// submitQuizAttemptAction (ARCHITECTURE.md 10.4): roles S T, the locale of the calling page,
// and the service's result and codes passed through unchanged.

vi.mock('next-intl/server', () => ({ getLocale: vi.fn(() => Promise.resolve('fr')) }));
vi.mock('@/lib/actions/session-source', () => ({
  getSession: vi.fn(),
  assertSessionNotRevoked: vi.fn(),
}));
vi.mock('@/lib/services/assessment', () => ({ submitQuizAttempt: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const student = sessionOf('student', 'stu-1');

function signIn(role: Role | null): void {
  vi.mocked(getSession).mockResolvedValue(role === null ? null : sessionOf(role, `${role}-1`));
}

const INPUT: SubmitQuizAttemptInput = {
  courseId: 'course-1',
  quizId: 'quiz-1',
  answers: {
    q1: { selectedOptionIds: ['o1'], text: null },
    q2: { selectedOptionIds: [], text: 'data' },
  },
};

const RESULT: QuizAttemptResult = {
  attempt: attempt({ userUid: 'stu-1', courseId: 'course-1', quizId: 'quiz-1' }),
  correctOptionIds: { q1: ['o1'] },
  explanations: { q1: 'Because.' },
  attemptsRemaining: null,
  gamification: outcome({ xpAwarded: 100 }),
};

beforeEach(() => {
  vi.mocked(submitQuizAttempt).mockReset();
  vi.mocked(revalidatePath).mockReset();
  vi.mocked(getSession).mockReset().mockResolvedValue(student);
  vi.mocked(assertSessionNotRevoked).mockReset().mockResolvedValue(undefined);
});

describe('submitQuizAttemptAction', () => {
  it('grades a student attempt with the page locale and returns the result unchanged', async () => {
    vi.mocked(submitQuizAttempt).mockResolvedValue(RESULT);

    const result = await submitQuizAttemptAction(INPUT);

    expect(result).toEqual({ ok: true, data: RESULT });
    expect(submitQuizAttempt).toHaveBeenCalledWith(student, {
      courseId: 'course-1',
      quizId: 'quiz-1',
      answers: INPUT.answers,
      locale: 'fr',
    });
  });

  it('lets a teacher through (Teacher Academy) and checks the staff cookie', async () => {
    signIn('teacher');
    vi.mocked(submitQuizAttempt).mockResolvedValue(RESULT);

    const result = await submitQuizAttemptAction(INPUT);

    expect(result).toEqual({ ok: true, data: RESULT });
    expect(vi.mocked(submitQuizAttempt).mock.calls[0]?.[0]).toMatchObject({
      role: 'teacher',
      uid: 'teacher-1',
    });
    expect(assertSessionNotRevoked).toHaveBeenCalledTimes(1);
  });

  it('refuses the admin roles before any service call', async () => {
    for (const role of ['school_admin', 'platform_admin'] as const) {
      signIn(role);
      expect(await submitQuizAttemptAction(INPUT)).toEqual({
        ok: false,
        error: { code: 'forbidden' },
      });
    }
    expect(submitQuizAttempt).not.toHaveBeenCalled();
  });

  it('answers unauthenticated without a session', async () => {
    signIn(null);
    expect(await submitQuizAttemptAction(INPUT)).toEqual({
      ok: false,
      error: { code: 'unauthenticated' },
    });
    expect(submitQuizAttempt).not.toHaveBeenCalled();
  });

  it('rejects malformed input as field errors without calling the service', async () => {
    const cases: [unknown, string][] = [
      [{ ...INPUT, courseId: 'bad id' }, 'courseId'],
      [{ ...INPUT, answers: [] }, 'answers'],
      [
        { ...INPUT, answers: { q1: { selectedOptionIds: [], text: 'x'.repeat(501) } } },
        'answers.q1.text',
      ],
    ];
    for (const [input, field] of cases) {
      const result = await submitQuizAttemptAction(input as SubmitQuizAttemptInput);
      expect(result.ok, field).toBe(false);
      if (result.ok) continue;
      expect(result.error.code, field).toBe('validation');
      expect(Object.keys(result.error.fieldErrors ?? {}), field).toContain(field);
    }
    expect(submitQuizAttempt).not.toHaveBeenCalled();
  });

  it('ignores a locale sent in the payload: only the page locale reaches the service', async () => {
    vi.mocked(submitQuizAttempt).mockResolvedValue(RESULT);

    await submitQuizAttemptAction({ ...INPUT, locale: 'en' } as SubmitQuizAttemptInput);

    expect(vi.mocked(submitQuizAttempt).mock.calls[0]?.[1]).toEqual({
      courseId: 'course-1',
      quizId: 'quiz-1',
      answers: INPUT.answers,
      locale: 'fr',
    });
  });

  it('passes the service codes through', async () => {
    const cases: [Error, object][] = [
      [new ConflictError('no attempt left'), { code: 'conflict' }],
      [new NotFoundError('not enrolled'), { code: 'not_found' }],
      [new ForbiddenError('audience'), { code: 'forbidden' }],
      [new LicenseRequiredError('lapsed'), { code: 'license_required' }],
      [
        new ValidationError('x', { answers: ['too_many'] }),
        { code: 'validation', fieldErrors: { answers: ['too_many'] } },
      ],
    ];
    for (const [error, expected] of cases) {
      vi.mocked(submitQuizAttempt).mockRejectedValueOnce(error);
      expect(await submitQuizAttemptAction(INPUT)).toEqual({ ok: false, error: expected });
    }
  });

  it('hides an unexpected failure behind internal', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(submitQuizAttempt).mockRejectedValueOnce(new Error('Firestore exploded'));

    expect(await submitQuizAttemptAction(INPUT)).toEqual({
      ok: false,
      error: { code: 'internal' },
    });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('never revalidates: the runner refreshes the lesson itself', async () => {
    vi.mocked(submitQuizAttempt).mockResolvedValue(RESULT);
    await submitQuizAttemptAction(INPUT);
    vi.mocked(submitQuizAttempt).mockRejectedValueOnce(new ConflictError());
    await submitQuizAttemptAction(INPUT);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
