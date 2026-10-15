import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  STUDENT_SCROLL_PADDING,
  StudentScrollPadding,
} from '@/components/student/StudentScrollPadding';
import {
  CONTINUE_LIMIT,
  continueItems,
  continueTarget,
  distinctPathwayIds,
  myPathways,
  withBadges,
} from '@/components/student/home-model';
import type { Pathway } from '@/types/content';
import { badge, course, enrollment, NOW } from './services-fixtures';

// WS-B home: the pure model of the Student Home (ARCHITECTURE.md 3.7, 6.4) and the hygiene of
// the `student` catalogs (10.5).

const UID = 'u1';

function pathway(fields: Partial<Pathway> & { id: string }): Pathway {
  return {
    order: 1,
    audience: 'student',
    kind: 'core',
    ageMin: 8,
    ageMax: 12,
    icon: 'Compass',
    accent: 'violet',
    status: 'published',
    publishedCourseCount: 2,
    defaultLocale: 'en',
    translations: {
      en: { title: `Pathway ${fields.id}`, tagline: '', description: '', topics: [] },
    },
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

describe('continueTarget', () => {
  it('sends a completed course to its course page to review it', () => {
    const target = continueTarget(
      enrollment({
        userUid: UID,
        courseId: 'c',
        status: 'completed',
        completedLessonIds: ['l1', 'l2'],
        completedLessonCount: 2,
        lastLessonId: 'l2',
      }),
    );
    expect(target).toEqual({ href: '/student/learn/courses/c', kind: 'review' });
  });

  it('goes straight back into the last lesson opened when it is not done yet', () => {
    const target = continueTarget(
      enrollment({
        userUid: UID,
        courseId: 'c',
        completedLessonIds: ['l1'],
        completedLessonCount: 1,
        lastLessonId: 'l2',
      }),
    );
    expect(target).toEqual({ href: '/student/learn/courses/c/lessons/l2', kind: 'continue' });
  });

  it('starts a course nothing was opened or done in from its course page', () => {
    const target = continueTarget(enrollment({ userUid: UID, courseId: 'c' }));
    expect(target).toEqual({ href: '/student/learn/courses/c', kind: 'start' });
  });

  it('lets the course page pick the next lesson when the last one opened is already done', () => {
    const done = continueTarget(
      enrollment({
        userUid: UID,
        courseId: 'c',
        completedLessonIds: ['l1'],
        completedLessonCount: 1,
        lastLessonId: 'l1',
      }),
    );
    expect(done).toEqual({ href: '/student/learn/courses/c', kind: 'continue' });

    // Lessons done but no last lesson recorded: still "continue", not "start".
    const noLast = continueTarget(
      enrollment({
        userUid: UID,
        courseId: 'c',
        completedLessonIds: ['l1'],
        completedLessonCount: 1,
        lastLessonId: null,
      }),
    );
    expect(noLast).toEqual({ href: '/student/learn/courses/c', kind: 'continue' });
  });

  it('opens a started lesson even when nothing is completed yet', () => {
    const target = continueTarget(enrollment({ userUid: UID, courseId: 'c', lastLessonId: 'l1' }));
    expect(target).toEqual({ href: '/student/learn/courses/c/lessons/l1', kind: 'continue' });
  });
});

describe('continueItems', () => {
  it('keeps the enrolment order and pairs each with its course and target', () => {
    const enrollments = [
      enrollment({ userUid: UID, courseId: 'b', lastLessonId: 'b1' }),
      enrollment({ userUid: UID, courseId: 'a', status: 'completed' }),
    ];
    const items = continueItems(enrollments, [course({ id: 'a' }), course({ id: 'b' })]);
    expect(items.map((item) => item.course.id)).toEqual(['b', 'a']);
    expect(items.map((item) => item.enrollment.courseId)).toEqual(['b', 'a']);
    expect(items.map((item) => item.target.kind)).toEqual(['continue', 'review']);
  });

  it('drops an enrolment whose course was not returned (hidden or archived)', () => {
    const enrollments = [
      enrollment({ userUid: UID, courseId: 'gone' }),
      enrollment({ userUid: UID, courseId: 'a' }),
    ];
    const items = continueItems(enrollments, [course({ id: 'a' })]);
    expect(items.map((item) => item.course.id)).toEqual(['a']);
  });

  it('caps the list at six, counted after the dropped ones', () => {
    const ids = ['gone', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'];
    const enrollments = ids.map((id) => enrollment({ userUid: UID, courseId: id }));
    const courses = ids.filter((id) => id !== 'gone').map((id) => course({ id }));
    const items = continueItems(enrollments, courses);
    expect(CONTINUE_LIMIT).toBe(6);
    expect(items.map((item) => item.course.id)).toEqual(['c1', 'c2', 'c3', 'c4', 'c5', 'c6']);
  });

  it('is empty without enrolments', () => {
    expect(continueItems([], [course({ id: 'a' })])).toEqual([]);
  });
});

describe('distinctPathwayIds', () => {
  it('lists each pathway once, in course order, without courses outside a pathway', () => {
    const courses = [
      course({ id: 'a', pathwayId: 'p2' }),
      course({ id: 'b', pathwayId: null }),
      course({ id: 'c', pathwayId: 'p1' }),
      course({ id: 'd', pathwayId: 'p2' }),
    ];
    expect(distinctPathwayIds(courses)).toEqual(['p2', 'p1']);
    expect(distinctPathwayIds([])).toEqual([]);
  });
});

describe('myPathways', () => {
  const courses = [
    course({ id: 'a1', pathwayId: 'a' }),
    course({ id: 'a2', pathwayId: 'a' }),
    course({ id: 'b1', pathwayId: 'b' }),
    course({ id: 'free', pathwayId: null }),
    course({ id: 't1', pathwayId: 'teach' }),
  ];

  it('counts the completed enrolled courses of each pathway', () => {
    const enrollments = [
      enrollment({ userUid: UID, courseId: 'a1', status: 'completed' }),
      enrollment({ userUid: UID, courseId: 'a2', status: 'completed' }),
      enrollment({ userUid: UID, courseId: 'b1' }),
    ];
    const items = myPathways(enrollments, courses, [
      pathway({ id: 'a', order: 1, publishedCourseCount: 3 }),
      pathway({ id: 'b', order: 2, publishedCourseCount: 4 }),
    ]);
    expect(items.map(({ pathway: p, completed, total }) => [p.id, completed, total])).toEqual([
      ['a', 2, 3],
      ['b', 0, 4],
    ]);
  });

  it('ignores teacher pathways, unpublished (null) pathways and courses without a pathway', () => {
    const enrollments = [
      enrollment({ userUid: UID, courseId: 'a1' }),
      enrollment({ userUid: UID, courseId: 'b1', status: 'completed' }),
      enrollment({ userUid: UID, courseId: 'free', status: 'completed' }),
      enrollment({ userUid: UID, courseId: 't1' }),
    ];
    const items = myPathways(enrollments, courses, [
      pathway({ id: 'a' }),
      null,
      pathway({ id: 'teach', audience: 'teacher' }),
    ]);
    expect(items.map((item) => item.pathway.id)).toEqual(['a']);
    expect(items[0]?.completed).toBe(0);
  });

  it('leaves out a pathway with no enrolled course and an enrolment whose course is hidden', () => {
    const enrollments = [enrollment({ userUid: UID, courseId: 'hidden', status: 'completed' })];
    const items = myPathways(enrollments, courses, [pathway({ id: 'a' }), pathway({ id: 'b' })]);
    expect(items).toEqual([]);
  });

  it('never reports a total below the completed count', () => {
    const enrollments = [
      enrollment({ userUid: UID, courseId: 'a1', status: 'completed' }),
      enrollment({ userUid: UID, courseId: 'a2', status: 'completed' }),
    ];
    const [item] = myPathways(enrollments, courses, [
      pathway({ id: 'a', publishedCourseCount: 1 }),
    ]);
    expect(item).toMatchObject({ completed: 2, total: 2 });
    const [empty] = myPathways([enrollment({ userUid: UID, courseId: 'a1' })], courses, [
      pathway({ id: 'a', publishedCourseCount: 0 }),
    ]);
    expect(empty).toMatchObject({ completed: 0, total: 0 });
  });

  it('sorts by pathway order and lists a pathway once', () => {
    const enrollments = [
      enrollment({ userUid: UID, courseId: 'a1' }),
      enrollment({ userUid: UID, courseId: 'b1' }),
    ];
    const items = myPathways(enrollments, courses, [
      pathway({ id: 'a', order: 5 }),
      pathway({ id: 'b', order: 2 }),
      pathway({ id: 'a', order: 5 }),
    ]);
    expect(items.map((item) => item.pathway.id)).toEqual(['b', 'a']);
  });
});

describe('withBadges', () => {
  it('pairs each award with its definition in award order and drops missing definitions', () => {
    const awards = [
      { badgeId: 'newest', awardedAt: '2026-10-03T00:00:00.000Z' },
      { badgeId: 'removed', awardedAt: '2026-10-02T00:00:00.000Z' },
      { badgeId: 'oldest', awardedAt: '2026-10-01T00:00:00.000Z' },
    ];
    const items = withBadges(awards, [badge({ id: 'oldest' }), null, badge({ id: 'newest' })]);
    expect(items.map(({ badge: b, awardedAt }) => [b.id, awardedAt])).toEqual([
      ['newest', '2026-10-03T00:00:00.000Z'],
      ['oldest', '2026-10-01T00:00:00.000Z'],
    ]);
  });

  it('does not read a prototype property for an id like "constructor"', () => {
    expect(withBadges([{ badgeId: 'constructor', awardedAt: NOW }], [])).toEqual([]);
  });
});

// Stopgap for foundation request WS-B-3: delete with StudentScrollPadding once it lands.
describe('StudentScrollPadding', () => {
  it('renders the root scroll padding as a server-rendered <style>', () => {
    const element = StudentScrollPadding();
    expect(element.type).toBe('style');
    expect(element.props).toEqual({ children: STUDENT_SCROLL_PADDING });
  });

  it('clears the sticky TopBar at every width and the bottom bar only below lg', () => {
    const [always, belowLg] = STUDENT_SCROLL_PADDING.split('@media');
    // The TopBar is min-h-16 (4rem) plus its border.
    expect(always).toBe('html{scroll-padding-top:4.5rem}');
    // The MobileNav is min-h-14 (3.5rem) plus its border and the safe area; it hides from lg.
    expect(belowLg).toBe(
      ' (width<64rem){html{scroll-padding-bottom:calc(5.5rem + env(safe-area-inset-bottom))}}',
    );
  });
});

// --- Catalog hygiene (10.5) ---------------------------------------------------------------------

const MESSAGES_DIR = path.join(import.meta.dirname, '..', '..', 'src', 'messages');

function leaves(node: unknown, prefix = ''): [string, string][] {
  if (typeof node === 'string') return [[prefix, node]];
  if (typeof node !== 'object' || node === null) return [];
  return Object.entries(node).flatMap(([key, value]) =>
    leaves(value, prefix ? `${prefix}.${key}` : key),
  );
}

function rawCatalog(locale: string): string {
  return readFileSync(path.join(MESSAGES_DIR, locale, 'student.json'), 'utf8');
}

describe.each(['en', 'fr'])('student catalog (%s)', (locale) => {
  const messages = leaves(JSON.parse(rawCatalog(locale)));

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

  it('writes French no-break spaces as the visible escape', () => {
    if (locale !== 'fr') return;
    for (const [key, value] of messages) {
      expect(value, key).not.toMatch(/\S [?!:;]/);
    }
    const raw = rawCatalog(locale);
    expect(raw.includes(String.fromCharCode(0xa0))).toBe(false);
    expect(raw).toContain('\\u00a0');
  });
});
