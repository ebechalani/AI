import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import {
  pathwayCardProgress,
  pathwayProgress,
  splitMyCourses,
} from '@/app/[locale]/student/(shell)/learn/_components/learn-model';
import {
  forbiddenCourseView,
  groupLessonsByModule,
  lessonHref,
  lessonStates,
  resumeLesson,
} from '@/app/[locale]/student/(shell)/learn/courses/[courseId]/_components/course-model';
import {
  pathwayCourseProgress,
  progressPercent,
} from '@/app/[locale]/student/(shell)/learn/pathways/[pathwayId]/_components/pathway-model';
import type { Module } from '@/types/content';
import { course, enrollment, lesson, NOW } from './services-fixtures';

// WS-B learn: the pure models of /student/learn, the pathway page and the course page
// (ARCHITECTURE.md 6.4, 9.4), and the hygiene of the `learn` catalogs (10.5).

const UID = 'u1';
const C = 'c1';

function module(id: string, order: number): Module {
  return {
    id,
    courseId: C,
    order,
    lessonCount: 0,
    defaultLocale: 'en',
    translations: { en: { title: `Module ${id}`, description: '' } },
    createdAt: NOW,
    updatedAt: NOW,
  };
}

const LESSONS = ['l1', 'l2', 'l3', 'l4'].map((id) => ({ id }));

// --- /student/learn ------------------------------------------------------------------------

describe('splitMyCourses', () => {
  it('keeps the enrolments’ order and splits them by status', () => {
    const courses = ['a', 'b', 'c'].map((id) => course({ id }));
    const { inProgress, completed } = splitMyCourses(
      [
        enrollment({ userUid: UID, courseId: 'c' }),
        enrollment({ userUid: UID, courseId: 'a', status: 'completed' }),
        enrollment({ userUid: UID, courseId: 'b' }),
      ],
      courses,
    );
    expect(inProgress.map((item) => item.course.id)).toEqual(['c', 'b']);
    expect(completed.map((item) => item.course.id)).toEqual(['a']);
    expect(inProgress[0]?.enrollment.courseId).toBe('c');
  });

  it('drops an enrolment whose course is missing or hidden', () => {
    const { inProgress, completed } = splitMyCourses(
      [
        enrollment({ userUid: UID, courseId: 'gone' }),
        enrollment({ userUid: UID, courseId: 'a' }),
        enrollment({ userUid: UID, courseId: 'gone-too', status: 'completed' }),
      ],
      [course({ id: 'a' })],
    );
    expect(inProgress.map((item) => item.course.id)).toEqual(['a']);
    expect(completed).toEqual([]);
  });

  it('is empty without enrolments', () => {
    expect(splitMyCourses([], [course({ id: 'a' })])).toEqual({ inProgress: [], completed: [] });
  });
});

describe('pathwayProgress', () => {
  const courses = [
    course({ id: 'a', pathwayId: 'p1' }),
    course({ id: 'b', pathwayId: 'p1' }),
    course({ id: 'c', pathwayId: 'p2' }),
    course({ id: 'd', pathwayId: null }),
  ];

  it('counts the completed courses of each pathway with an enrolment', () => {
    const progress = pathwayProgress(
      [
        enrollment({ userUid: UID, courseId: 'a', status: 'completed' }),
        enrollment({ userUid: UID, courseId: 'b', status: 'completed' }),
        enrollment({ userUid: UID, courseId: 'c' }),
      ],
      courses,
    );
    expect(progress.get('p1')).toBe(2);
    expect(progress.get('p2')).toBe(0);
  });

  it('leaves out pathways without enrolments, standalone courses and missing courses', () => {
    const progress = pathwayProgress(
      [
        enrollment({ userUid: UID, courseId: 'd', status: 'completed' }),
        enrollment({ userUid: UID, courseId: 'gone', status: 'completed' }),
      ],
      courses,
    );
    expect([...progress.keys()]).toEqual([]);
  });
});

describe('pathwayCardProgress', () => {
  const pathway = { id: 'p1', publishedCourseCount: 3 };

  it('is undefined for a pathway without an enrolment', () => {
    expect(pathwayCardProgress(pathway, new Map())).toBeUndefined();
  });

  it('uses the published course count as the total', () => {
    expect(pathwayCardProgress(pathway, new Map([['p1', 0]]))).toEqual({
      completed: 0,
      total: 3,
    });
  });

  it('never lets the total fall below the completed count (the Home formula)', () => {
    expect(pathwayCardProgress(pathway, new Map([['p1', 5]]))).toEqual({
      completed: 5,
      total: 5,
    });
  });
});

// --- /student/learn/pathways/[pathwayId] ---------------------------------------------------

describe('pathwayCourseProgress', () => {
  it('counts enrolled and completed courses over the visible ones', () => {
    const visible = ['a', 'b', 'c'].map((id) => course({ id }));
    const byCourse = new Map([
      ['a', enrollment({ userUid: UID, courseId: 'a', status: 'completed' })],
      ['b', enrollment({ userUid: UID, courseId: 'b' })],
      // An enrolment in a course that is not shown on the page does not count.
      ['x', enrollment({ userUid: UID, courseId: 'x', status: 'completed' })],
    ]);
    expect(pathwayCourseProgress(visible, byCourse)).toEqual({
      enrolled: 2,
      completed: 1,
      total: 3,
    });
  });

  it('is all zeros for a pathway without courses', () => {
    expect(pathwayCourseProgress([], new Map())).toEqual({ enrolled: 0, completed: 0, total: 0 });
  });
});

describe('progressPercent', () => {
  it('rounds to a whole percentage', () => {
    expect(progressPercent(1, 3)).toBe(33);
    expect(progressPercent(2, 3)).toBe(67);
    expect(progressPercent(3, 3)).toBe(100);
  });

  it('is 0 without courses (no division by zero)', () => {
    expect(progressPercent(0, 0)).toBe(0);
  });
});

// --- /student/learn/courses/[courseId] -----------------------------------------------------

function progressOf(completedLessonIds: string[], lastLessonId: string | null) {
  return { completedLessonIds, lastLessonId };
}

describe('resumeLesson', () => {
  it('is null for a course without lessons', () => {
    expect(resumeLesson([], null)).toBeNull();
    expect(resumeLesson([], progressOf([], 'l1'))).toBeNull();
  });

  it('starts at the first lesson without an enrolment', () => {
    expect(resumeLesson(LESSONS, null)).toEqual({ lessonId: 'l1', kind: 'start' });
  });

  it('continues the lesson last opened when it is not completed', () => {
    expect(resumeLesson(LESSONS, progressOf(['l1'], 'l3'))).toEqual({
      lessonId: 'l3',
      kind: 'continue',
    });
  });

  it('falls through to the first lesson not completed when the last one is done', () => {
    expect(resumeLesson(LESSONS, progressOf(['l1', 'l2'], 'l2'))).toEqual({
      lessonId: 'l3',
      kind: 'continue',
    });
  });

  it('falls through when the last lesson no longer exists in the outline', () => {
    expect(resumeLesson(LESSONS, progressOf(['l1'], 'removed'))).toEqual({
      lessonId: 'l2',
      kind: 'continue',
    });
  });

  it('starts a fresh enrolment at the first lesson', () => {
    expect(resumeLesson(LESSONS, progressOf([], null))).toEqual({
      lessonId: 'l1',
      kind: 'start',
    });
  });

  it('continues (not starts) once a lesson was opened, even with nothing completed', () => {
    expect(resumeLesson(LESSONS, progressOf([], 'l1'))).toEqual({
      lessonId: 'l1',
      kind: 'continue',
    });
  });

  it('continues at a gap left in the middle of the course', () => {
    expect(resumeLesson(LESSONS, progressOf(['l1', 'l3', 'l4'], null))).toEqual({
      lessonId: 'l2',
      kind: 'continue',
    });
  });

  it('reviews from the first lesson when every lesson is completed', () => {
    expect(resumeLesson(LESSONS, progressOf(['l4', 'l3', 'l2', 'l1'], 'l4'))).toEqual({
      lessonId: 'l1',
      kind: 'review',
    });
  });

  it('continues to a lesson added after the course was completed', () => {
    const done = progressOf(['l1', 'l2', 'l3'], 'l3');
    expect(resumeLesson(LESSONS, done)).toEqual({ lessonId: 'l4', kind: 'continue' });
  });

  it('matches the seed: student@demo completed m1-l1 and last opened m1-l2', () => {
    const seed = ['m1-l1', 'm1-l2', 'm2-l1', 'm2-l2'].map((id) => ({ id }));
    expect(resumeLesson(seed, progressOf(['m1-l1'], 'm1-l2'))).toEqual({
      lessonId: 'm1-l2',
      kind: 'continue',
    });
  });
});

describe('lessonStates', () => {
  it('marks completed lessons and the enrolled student’s next lesson', () => {
    const enrolled = progressOf(['l1'], 'l2');
    const states = lessonStates(LESSONS, enrolled, resumeLesson(LESSONS, enrolled));
    expect([...states.entries()]).toEqual([
      ['l1', 'completed'],
      ['l2', 'resume'],
      ['l3', 'todo'],
      ['l4', 'todo'],
    ]);
  });

  it('has no resume marker without an enrolment', () => {
    const states = lessonStates(LESSONS, null, resumeLesson(LESSONS, null));
    expect([...states.values()]).toEqual(['todo', 'todo', 'todo', 'todo']);
  });

  it('has no resume marker when the course is being reviewed', () => {
    const done = progressOf(['l1', 'l2', 'l3', 'l4'], 'l4');
    const states = lessonStates(LESSONS, done, resumeLesson(LESSONS, done));
    expect([...states.values()]).toEqual(['completed', 'completed', 'completed', 'completed']);
  });

  it('ignores completed ids that are no longer in the outline', () => {
    const enrolled = progressOf(['removed'], null);
    const states = lessonStates(LESSONS, enrolled, resumeLesson(LESSONS, enrolled));
    expect(states.has('removed')).toBe(false);
    expect(states.get('l1')).toBe('next');
  });

  it('marks the first lesson of a fresh enrolment as next, not where the student left off', () => {
    const fresh = progressOf([], null);
    const resume = resumeLesson(LESSONS, fresh);
    expect(resume?.kind).toBe('start');
    expect([...lessonStates(LESSONS, fresh, resume).values()]).toEqual([
      'next',
      'todo',
      'todo',
      'todo',
    ]);
  });

  it('marks a lesson opened but not finished as where the student left off', () => {
    const opened = progressOf([], 'l1');
    const states = lessonStates(LESSONS, opened, resumeLesson(LESSONS, opened));
    expect(states.get('l1')).toBe('resume');
  });

  it('marks the lesson after the last one finished as next', () => {
    const enrolled = progressOf(['l1', 'l2'], 'l2');
    const states = lessonStates(LESSONS, enrolled, resumeLesson(LESSONS, enrolled));
    expect([...states.entries()]).toEqual([
      ['l1', 'completed'],
      ['l2', 'completed'],
      ['l3', 'next'],
      ['l4', 'todo'],
    ]);
  });

  it('matches the seed: omar.demo resumes m2-l1, the lesson he started', () => {
    const seed = ['m1-l1', 'm1-l2', 'm2-l1', 'm2-l2'].map((id) => ({ id }));
    const omar = progressOf(['m1-l1', 'm1-l2'], 'm2-l1');
    expect([...lessonStates(seed, omar, resumeLesson(seed, omar)).values()]).toEqual([
      'completed',
      'completed',
      'resume',
      'todo',
    ]);
  });
});

describe('groupLessonsByModule', () => {
  it('groups the lessons under their module, in order, and numbers the modules', () => {
    const modules = [module('m1', 0), module('m2', 1)];
    const lessons = [
      lesson({ id: 'a', courseId: C, moduleId: 'm1' }),
      lesson({ id: 'b', courseId: C, moduleId: 'm1' }),
      lesson({ id: 'c', courseId: C, moduleId: 'm2' }),
    ];
    const groups = groupLessonsByModule(modules, lessons);
    expect(groups.map((group) => [group.module.id, group.number])).toEqual([
      ['m1', 1],
      ['m2', 2],
    ]);
    expect(groups.map((group) => group.lessons.map((item) => item.id))).toEqual([
      ['a', 'b'],
      ['c'],
    ]);
  });

  it('leaves out a module without lessons but keeps the others’ course position', () => {
    const modules = [module('m1', 0), module('m2', 1)];
    const groups = groupLessonsByModule(modules, [
      lesson({ id: 'c', courseId: C, moduleId: 'm2' }),
    ]);
    expect(groups.map((group) => [group.module.id, group.number])).toEqual([['m2', 2]]);
  });

  it('is empty for a course without modules', () => {
    expect(groupLessonsByModule([], [])).toEqual([]);
  });
});

describe('forbiddenCourseView', () => {
  it('explains a published Teacher Academy course', () => {
    expect(forbiddenCourseView(course({ id: 'ta', audience: 'teacher' }))).toBe('teacherOnly');
  });

  it('is "unavailable" for anything else', () => {
    expect(forbiddenCourseView(null)).toBe('unavailable');
    expect(forbiddenCourseView(course({ id: 'a', audience: 'student' }))).toBe('unavailable');
  });
});

describe('lessonHref', () => {
  it('is the student player route (locale-less)', () => {
    expect(lessonHref('my-first-ai-adventure', 'm1-l2')).toBe(
      '/student/learn/courses/my-first-ai-adventure/lessons/m1-l2',
    );
  });
});

// --- Catalog hygiene (10.5) ----------------------------------------------------------------

const MESSAGES_DIR = path.join(import.meta.dirname, '..', '..', 'src', 'messages');

function leaves(node: unknown, prefix = ''): [string, string][] {
  if (typeof node === 'string') return [[prefix, node]];
  if (typeof node !== 'object' || node === null) return [];
  return Object.entries(node).flatMap(([key, value]) =>
    leaves(value, prefix ? `${prefix}.${key}` : key),
  );
}

function rawCatalog(locale: string): string {
  return readFileSync(path.join(MESSAGES_DIR, locale, 'learn.json'), 'utf8');
}

// Every argument any `learn` message takes, so each message can be formatted.
const VALUES = { completed: 1, total: 4, number: 2, xp: 50, title: 'Robots 101' };

// The raw JSON catalog is checked as data, so the app's typed `AppConfig` does not apply.
const translate = createTranslator as unknown as (config: {
  locale: string;
  messages: Record<string, unknown>;
  namespace: string;
  onError: (error: Error) => void;
}) => (key: string, values: typeof VALUES) => string;

describe.each(['en', 'fr'])('learn catalog (%s)', (locale) => {
  const catalog: unknown = JSON.parse(rawCatalog(locale));
  const messages = leaves(catalog);

  it('uses typographic apostrophes and balanced braces', () => {
    for (const [key, value] of messages) {
      expect(value, key).not.toMatch(/'/);
      expect(value, key).toMatch(/^[^{}]*(\{[^{}]*(\{[^{}]*\}[^{}]*)*\}[^{}]*)*$/);
    }
  });

  it('has the same keys as the English source', () => {
    const source = leaves(JSON.parse(rawCatalog('en'))).map(([key]) => key);
    expect(messages.map(([key]) => key).sort()).toEqual(source.sort());
  });

  it('formats every message as ICU without an error', () => {
    const errors: string[] = [];
    const t = translate({
      locale,
      messages: { learn: catalog },
      namespace: 'learn',
      onError: (error) => errors.push(error.message),
    });
    for (const [key] of messages) {
      expect(t(key, VALUES), key).not.toContain('learn.');
    }
    expect(errors).toEqual([]);
  });

  it('agrees the course and lesson counts with their numbers', () => {
    const t = translate({
      locale,
      messages: { learn: catalog },
      namespace: 'learn',
      onError: (error) => {
        throw error;
      },
    });
    const format = (key: string, completed: number, total: number) =>
      t(key, { ...VALUES, completed, total });
    const expected: Record<string, [string, string, string, string]> = {
      en: [
        '0 of 1 course completed',
        '2 of 3 courses completed',
        '1 of 1 lesson completed',
        '0 of 2 lessons completed',
      ],
      fr: [
        '0 cours terminé sur 1',
        '2 cours terminés sur 3',
        '1 leçon terminée sur 1',
        '0 leçon terminée sur 2',
      ],
    };
    expect([
      format('pathway.progress', 0, 1),
      format('pathway.progress', 2, 3),
      format('course.progress.lessons', 1, 1),
      format('course.progress.lessons', 0, 2),
    ]).toEqual(expected[locale]);
  });

  it('writes French no-break spaces as the visible escape', () => {
    if (locale !== 'fr') return;
    for (const [key, value] of messages) {
      expect(value, key).not.toMatch(/\S [?!:;»%]/);
      expect(value, key).not.toMatch(/« /);
    }
    const raw = rawCatalog(locale);
    expect(raw.includes(String.fromCharCode(0xa0))).toBe(false);
    expect(raw).toContain('\\u00a0');
  });
});
