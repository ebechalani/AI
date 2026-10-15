import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  completeLessonAction,
  enrollInCourseAction,
  saveBlockResponseAction,
  startLessonAction,
} from '@/actions/learning';
import { assertSessionNotRevoked, getSession } from '@/lib/actions/session-source';
import { getCourseOutline } from '@/lib/data/courses';
import { ConflictError, ForbiddenError, LicenseRequiredError, NotFoundError } from '@/lib/errors';
import { completeLesson, enrollSelf, saveResponse, startLesson } from '@/lib/services/learning';
import type { LessonCompletionResult, Role } from '@/types';
import { course, enrollment, lesson, outcome, session as sessionOf } from './services-fixtures';

// The four learning actions of WS-B (ARCHITECTURE.md 10.4): the roles they let through, what
// they hand to the learning service, and that the service's codes reach the client unchanged.

vi.mock('next-intl/server', () => ({ getLocale: vi.fn(() => Promise.resolve('en')) }));
vi.mock('@/lib/actions/session-source', () => ({
  getSession: vi.fn(),
  assertSessionNotRevoked: vi.fn(),
}));
vi.mock('@/lib/services/learning', () => ({
  enrollSelf: vi.fn(),
  startLesson: vi.fn(),
  saveResponse: vi.fn(),
  completeLesson: vi.fn(),
}));
vi.mock('@/lib/data/courses', () => ({ getCourseOutline: vi.fn() }));

const student = sessionOf('student', 'stu-1');

function signIn(role: Role | null): void {
  vi.mocked(getSession).mockResolvedValue(role === null ? null : sessionOf(role, `${role}-1`));
}

const serviceMocks = [enrollSelf, startLesson, saveResponse, completeLesson, getCourseOutline];

beforeEach(() => {
  for (const mock of serviceMocks) vi.mocked(mock).mockReset();
  vi.mocked(getSession).mockReset().mockResolvedValue(student);
  vi.mocked(assertSessionNotRevoked).mockReset().mockResolvedValue(undefined);
});

function outlineWith(lessonIds: string[]) {
  return {
    course: course({ id: 'course-1' }),
    modules: [],
    lessons: lessonIds.map((id) => lesson({ id, courseId: 'course-1' })),
  };
}

describe('enrollInCourseAction', () => {
  it('enrols the actor, then names the first lesson of the sorted outline', async () => {
    vi.mocked(enrollSelf).mockResolvedValue(enrollment({ userUid: 'stu-1', courseId: 'course-1' }));
    vi.mocked(getCourseOutline).mockResolvedValue(outlineWith(['m1-l1', 'm1-l2']));

    const result = await enrollInCourseAction({ courseId: 'course-1' });

    expect(result).toEqual({
      ok: true,
      data: { enrollmentId: 'stu-1_course-1', firstLessonId: 'm1-l1' },
    });
    expect(enrollSelf).toHaveBeenCalledWith(student, 'course-1');
    expect(getCourseOutline).toHaveBeenCalledWith(student, 'course-1');
    expect(vi.mocked(enrollSelf).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(getCourseOutline).mock.invocationCallOrder[0]!,
    );
  });

  it('answers a null first lesson for a course without lessons', async () => {
    vi.mocked(enrollSelf).mockResolvedValue(enrollment({ userUid: 'stu-1', courseId: 'course-1' }));
    vi.mocked(getCourseOutline).mockResolvedValue(outlineWith([]));

    expect(await enrollInCourseAction({ courseId: 'course-1' })).toEqual({
      ok: true,
      data: { enrollmentId: 'stu-1_course-1', firstLessonId: null },
    });
  });

  it('lets a teacher through (Teacher Academy) and checks the staff cookie', async () => {
    signIn('teacher');
    vi.mocked(enrollSelf).mockResolvedValue(
      enrollment({ userUid: 'teacher-1', courseId: 'course-1' }),
    );
    vi.mocked(getCourseOutline).mockResolvedValue(outlineWith(['l1']));

    const result = await enrollInCourseAction({ courseId: 'course-1' });

    expect(result.ok).toBe(true);
    expect(assertSessionNotRevoked).toHaveBeenCalledTimes(1);
  });

  it('refuses the admin roles before any service call', async () => {
    for (const role of ['school_admin', 'platform_admin'] as const) {
      signIn(role);
      expect(await enrollInCourseAction({ courseId: 'course-1' })).toEqual({
        ok: false,
        error: { code: 'forbidden' },
      });
    }
    expect(enrollSelf).not.toHaveBeenCalled();
  });

  it('answers unauthenticated without a session', async () => {
    signIn(null);
    expect(await enrollInCourseAction({ courseId: 'course-1' })).toEqual({
      ok: false,
      error: { code: 'unauthenticated' },
    });
    expect(enrollSelf).not.toHaveBeenCalled();
  });

  it('rejects a malformed course id as a field error without calling the service', async () => {
    expect(await enrollInCourseAction({ courseId: 'a/b' })).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { courseId: ['invalid'] } },
    });
    expect(getSession).not.toHaveBeenCalled();
    expect(enrollSelf).not.toHaveBeenCalled();
  });

  it.each([
    [new LicenseRequiredError('premium'), 'license_required'],
    [new ConflictError('draft'), 'conflict'],
    [new NotFoundError('no course'), 'not_found'],
    [new ForbiddenError('teacher course'), 'forbidden'],
  ] as const)('passes the service code through (%s)', async (error, code) => {
    vi.mocked(enrollSelf).mockRejectedValue(error);
    expect(await enrollInCourseAction({ courseId: 'course-1' })).toEqual({
      ok: false,
      error: { code },
    });
    expect(getCourseOutline).not.toHaveBeenCalled();
  });

  it('turns an unexpected failure into internal and logs it on the server', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(enrollSelf).mockRejectedValue(new Error('Firestore down'));

    expect(await enrollInCourseAction({ courseId: 'course-1' })).toEqual({
      ok: false,
      error: { code: 'internal' },
    });
    expect(logged).toHaveBeenCalledTimes(1);
    logged.mockRestore();
  });
});

describe('startLessonAction', () => {
  it('forwards the ids and answers null', async () => {
    vi.mocked(startLesson).mockResolvedValue(undefined);
    expect(await startLessonAction({ courseId: 'course-1', lessonId: 'm1-l2' })).toEqual({
      ok: true,
      data: null,
    });
    expect(startLesson).toHaveBeenCalledWith(student, 'course-1', 'm1-l2');
  });

  it('answers not_found when the actor is not enrolled', async () => {
    vi.mocked(startLesson).mockRejectedValue(new NotFoundError('not enrolled'));
    expect(await startLessonAction({ courseId: 'course-1', lessonId: 'm1-l2' })).toEqual({
      ok: false,
      error: { code: 'not_found' },
    });
  });

  it('refuses a school admin', async () => {
    signIn('school_admin');
    expect(await startLessonAction({ courseId: 'course-1', lessonId: 'm1-l2' })).toEqual({
      ok: false,
      error: { code: 'forbidden' },
    });
    expect(startLesson).not.toHaveBeenCalled();
  });
});

describe('saveBlockResponseAction', () => {
  const ref = { courseId: 'course-1', lessonId: 'm1-l1', blockId: 'm1-l1-b4' };

  it('saves the text exactly as typed, indentation and newline included', async () => {
    vi.mocked(saveResponse).mockResolvedValue(undefined);
    expect(await saveBlockResponseAction({ ...ref, text: '  x = 1\n' })).toEqual({
      ok: true,
      data: null,
    });
    expect(saveResponse).toHaveBeenCalledWith(
      student,
      'course-1',
      'm1-l1',
      'm1-l1-b4',
      '  x = 1\n',
    );
  });

  it('rejects a response longer than the limit as a field error', async () => {
    expect(await saveBlockResponseAction({ ...ref, text: 'a'.repeat(10_001) })).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { text: ['too_long'] } },
    });
    expect(saveResponse).not.toHaveBeenCalled();
  });

  it('accepts a response of exactly the limit', async () => {
    vi.mocked(saveResponse).mockResolvedValue(undefined);
    const result = await saveBlockResponseAction({ ...ref, text: 'a'.repeat(10_000) });
    expect(result.ok).toBe(true);
  });

  it('passes not_found (a block that takes no response) and conflict through', async () => {
    vi.mocked(saveResponse).mockRejectedValueOnce(new NotFoundError('no such block'));
    expect(await saveBlockResponseAction({ ...ref, text: 'hello' })).toEqual({
      ok: false,
      error: { code: 'not_found' },
    });
    vi.mocked(saveResponse).mockRejectedValueOnce(new ConflictError('slot full'));
    expect(await saveBlockResponseAction({ ...ref, text: 'hello' })).toEqual({
      ok: false,
      error: { code: 'conflict' },
    });
  });
});

describe('completeLessonAction', () => {
  const missing: LessonCompletionResult = {
    completed: false,
    missing: { quizIds: ['quiz-m1'], projectIds: [], reflectionBlockIds: ['m1-l2-b5'] },
    enrollment: enrollment({ userUid: 'stu-1', courseId: 'course-1' }),
    gamification: null,
  };
  const done: LessonCompletionResult = {
    completed: true,
    missing: { quizIds: [], projectIds: [], reflectionBlockIds: [] },
    enrollment: enrollment({
      userUid: 'stu-1',
      courseId: 'course-1',
      completedLessonIds: ['m1-l1'],
      completedLessonCount: 1,
      progressPercent: 33,
    }),
    gamification: outcome({ xpAwarded: 50 }),
  };

  it('returns a not-ready answer as is, with what is missing', async () => {
    vi.mocked(completeLesson).mockResolvedValue(missing);
    expect(await completeLessonAction({ courseId: 'course-1', lessonId: 'm1-l2' })).toEqual({
      ok: true,
      data: missing,
    });
    expect(completeLesson).toHaveBeenCalledWith(student, 'course-1', 'm1-l2');
  });

  it('returns a completion as is, with what was earned', async () => {
    vi.mocked(completeLesson).mockResolvedValue(done);
    expect(await completeLessonAction({ courseId: 'course-1', lessonId: 'm1-l1' })).toEqual({
      ok: true,
      data: done,
    });
  });

  it('passes license_required and forbidden through', async () => {
    vi.mocked(completeLesson).mockRejectedValueOnce(new LicenseRequiredError('lapsed'));
    expect(await completeLessonAction({ courseId: 'course-1', lessonId: 'm1-l1' })).toEqual({
      ok: false,
      error: { code: 'license_required' },
    });
    vi.mocked(completeLesson).mockRejectedValueOnce(new ForbiddenError('lesson.complete'));
    expect(await completeLessonAction({ courseId: 'course-1', lessonId: 'm1-l1' })).toEqual({
      ok: false,
      error: { code: 'forbidden' },
    });
  });

  it('rejects a malformed lesson id without calling the service', async () => {
    const result = await completeLessonAction({ courseId: 'course-1', lessonId: '../x' });
    expect(result).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { lessonId: ['invalid'] } },
    });
    expect(completeLesson).not.toHaveBeenCalled();
  });
});
