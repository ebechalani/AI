import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SYSTEM_ACTOR } from '@/lib/auth/actor';
import { getCourse, getLesson } from '@/lib/data/courses';
import { getPublishedPathway } from '@/lib/data/pathways';
import { listRecentAttemptsForUser } from '@/lib/data/quizzes';
import { ForbiddenError, LicenseRequiredError, NotFoundError } from '@/lib/errors';
import { getCourseAccess } from '@/lib/services/access';
import { buildTutorContext } from '@/lib/services/tutor-context';
import type { Pathway } from '@/types';
import { attempt, course, lesson, session, NOW } from './services-fixtures';

// services/tutor-context over mocked repositories: what the tutor is told (8.3) and, above
// all, what it is not told.

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(() => {
    throw new Error('Firestore was reached.');
  }),
}));
vi.mock('@/lib/data/courses', () => ({ getCourse: vi.fn(), getLesson: vi.fn() }));
vi.mock('@/lib/data/pathways', () => ({ getPublishedPathway: vi.fn() }));
vi.mock('@/lib/data/quizzes', () => ({ listRecentAttemptsForUser: vi.fn() }));
vi.mock('@/lib/services/access', () => ({ getCourseAccess: vi.fn() }));

const student = session('student', 'student-1', 'school-a', ['class-a'], {
  displayName: 'Lea Demo',
  ageBand: '13-15',
});
const teacher = session('teacher', 'teacher-1', 'school-a');
const schoolAdmin = session('school_admin', 'admin-a', 'school-a');

const pathway: Pathway = {
  id: 'ai-explorer',
  order: 1,
  audience: 'student',
  kind: 'core',
  ageMin: 8,
  ageMax: 12,
  icon: 'compass',
  accent: 'violet',
  status: 'published',
  publishedCourseCount: 3,
  defaultLocale: 'en',
  translations: {
    en: { title: 'AI Explorer', tagline: '', description: '', topics: [] },
    fr: { title: 'Explorateur IA', tagline: '', description: '', topics: [] },
  },
  createdAt: NOW,
  updatedAt: NOW,
};
const official = course({ id: 'course-1' });
const teacherMade = course({
  id: 'course-t',
  isOfficial: false,
  ownerUid: 'teacher-1',
  schoolId: 'school-a',
  pathwayId: null,
  visibility: 'school',
});
const graded = lesson({
  id: 'l2',
  courseId: 'course-1',
  quizIds: ['quiz-1'],
  tutorExcerpt: {
    en: 'An AI system learns from examples.',
    fr: 'Un systeme IA apprend par l exemple.',
  },
  translations: {
    en: { title: 'What is AI?', summary: 'Machines that learn' },
    fr: { title: "Qu'est-ce que l'IA ?", summary: '' },
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCourseAccess).mockResolvedValue({ allowed: true, via: 'free' });
  vi.mocked(getCourse).mockImplementation(async (_actor, courseId) => {
    if (courseId === 'course-1') return official;
    if (courseId === 'course-t') return teacherMade;
    throw new NotFoundError(`courses/${courseId}`);
  });
  vi.mocked(getLesson).mockImplementation(async (_actor, courseId, lessonId) => {
    if (lessonId === 'l2') return { ...graded, courseId };
    throw new NotFoundError(`lessons/${lessonId}`);
  });
  vi.mocked(getPublishedPathway).mockResolvedValue(pathway);
  vi.mocked(listRecentAttemptsForUser).mockResolvedValue([
    attempt({
      userUid: 'student-1',
      courseId: 'course-1',
      quizId: 'quiz-1',
      quizTitle: { en: { title: 'Patterns' }, fr: { title: 'Motifs' } },
      scorePercent: 80,
      passed: true,
    }),
    attempt({
      userUid: 'student-1',
      courseId: 'course-1',
      quizId: 'quiz-2',
      quizTitle: { en: { title: 'Data' } },
      scorePercent: 40,
      passed: false,
    }),
  ]);
});

describe('buildTutorContext', () => {
  it("describes the lesson of an official course in the learner's language", async () => {
    const context = await buildTutorContext(student, {
      mode: 'explain',
      courseId: 'course-1',
      lessonId: 'l2',
      locale: 'fr',
    });
    expect(context).toEqual({
      mode: 'explain',
      ageBand: '13-15',
      locale: 'fr',
      hasGradedWork: true,
      reference: {
        pathwayTitle: 'Explorateur IA',
        courseTitle: 'Cours course-1',
        lessonTitle: "Qu'est-ce que l'IA ?",
        // Blank in French: falls back to the default locale.
        lessonSummary: 'Machines that learn',
        lessonExcerpt: 'Un systeme IA apprend par l exemple.',
      },
      recentQuizResults: [
        { quizTitle: 'Motifs', scorePercent: 80, passed: true },
        { quizTitle: 'Data', scorePercent: 40, passed: false },
      ],
    });
    expect(listRecentAttemptsForUser).toHaveBeenCalledWith(student, 'student-1', { limit: 3 });
  });

  it('carries nothing that identifies the learner, the school or the class', () => {
    return buildTutorContext(student, {
      mode: 'hint',
      courseId: 'course-1',
      lessonId: 'l2',
      locale: 'en',
    }).then((context) => {
      const serialized = JSON.stringify(context);
      for (const secret of ['student-1', 'Lea Demo', 'school-a', 'class-a', 'quiz-1', 'o1']) {
        expect(serialized).not.toContain(secret);
      }
      expect(Object.keys(context).sort()).toEqual(
        ['ageBand', 'hasGradedWork', 'locale', 'mode', 'recentQuizResults', 'reference'].sort(),
      );
    });
  });

  it('quotes no excerpt of a teacher-made course and reads no pathway for it', async () => {
    vi.mocked(getLesson).mockResolvedValueOnce({ ...graded, courseId: 'course-t' });
    const context = await buildTutorContext(teacher, {
      mode: 'explain',
      courseId: 'course-t',
      lessonId: 'l2',
      locale: 'en',
    });
    expect(context.reference.lessonExcerpt).toBeNull();
    expect(context.reference.lessonTitle).toBe('What is AI?');
    expect(context.reference.pathwayTitle).toBeNull();
    expect(getPublishedPathway).not.toHaveBeenCalled();
  });

  it('works without a course: an empty reference and the recent results only', async () => {
    const context = await buildTutorContext(student, {
      mode: 'quiz_me',
      courseId: null,
      lessonId: null,
      locale: 'en',
    });
    expect(context.hasGradedWork).toBe(false);
    expect(context.reference).toEqual({
      pathwayTitle: null,
      courseTitle: null,
      lessonTitle: null,
      lessonSummary: null,
      lessonExcerpt: null,
    });
    expect(context.recentQuizResults).toHaveLength(2);
    expect(getCourse).not.toHaveBeenCalled();
  });

  it('answers only a course alone when no lesson is named', async () => {
    const context = await buildTutorContext(student, {
      mode: 'give_example',
      courseId: 'course-1',
      lessonId: null,
      locale: 'en',
    });
    expect(context.reference.courseTitle).toBe('Course course-1');
    expect(context.reference.lessonTitle).toBeNull();
    expect(context.hasGradedWork).toBe(false);
    expect(getLesson).not.toHaveBeenCalled();
  });

  it('refuses roles without a tutor and the system, and hides courses the actor may not open', async () => {
    const request = {
      mode: 'explain' as const,
      courseId: 'course-1',
      lessonId: null,
      locale: 'en' as const,
    };
    await expect(buildTutorContext(schoolAdmin, request)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(buildTutorContext(SYSTEM_ACTOR, request)).rejects.toBeInstanceOf(ForbiddenError);
    vi.mocked(getCourseAccess).mockResolvedValueOnce({ allowed: false, reason: 'not_visible' });
    await expect(buildTutorContext(student, request)).rejects.toBeInstanceOf(NotFoundError);
    vi.mocked(getCourseAccess).mockResolvedValueOnce({
      allowed: false,
      reason: 'license_required',
    });
    await expect(buildTutorContext(student, request)).rejects.toBeInstanceOf(LicenseRequiredError);
  });
});
