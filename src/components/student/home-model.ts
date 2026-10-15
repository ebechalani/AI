import type { Course, Pathway } from '@/types/content';
import type { IsoDateString } from '@/types/common';
import type { Badge, UserBadge } from '@/types/gamification';
import type { Enrollment } from '@/types/learning';

// The pure part of the Student Home (ARCHITECTURE.md 3.7, 6.4): what "Continue learning" and
// "My pathways" show, computed from the reads the page already made. Types only, no React and
// no server code, so Vitest imports it directly.

/** "Continue learning" lists the first six enrolments (3.7). */
export const CONTINUE_LIMIT = 6;

export type ContinueKind = 'continue' | 'start' | 'review';

export interface ContinueTarget {
  /** Locale-less path. */
  href: string;
  kind: ContinueKind;
}

export interface ContinueItem {
  enrollment: Enrollment;
  course: Course;
  target: ContinueTarget;
}

export interface PathwayProgressItem {
  pathway: Pathway;
  /** Completed enrolled courses of the pathway. */
  completed: number;
  /** Never below `completed`, so the bar never runs past 100 %. */
  total: number;
}

export interface EarnedBadge {
  badge: Badge;
  awardedAt: IsoDateString;
}

type TargetFields = Pick<
  Enrollment,
  'courseId' | 'status' | 'lastLessonId' | 'completedLessonIds' | 'completedLessonCount'
>;

/**
 * Where the button of one "Continue learning" card goes. Home has no course outline (3.7), so
 * when the last lesson opened is already done the course page picks the next lesson.
 */
export function continueTarget(enrollment: TargetFields): ContinueTarget {
  const course = `/student/learn/courses/${enrollment.courseId}`;
  if (enrollment.status === 'completed') return { href: course, kind: 'review' };
  const { lastLessonId } = enrollment;
  if (lastLessonId !== null && !enrollment.completedLessonIds.includes(lastLessonId)) {
    return { href: `${course}/lessons/${lastLessonId}`, kind: 'continue' };
  }
  if (enrollment.completedLessonCount === 0 && lastLessonId === null) {
    return { href: course, kind: 'start' };
  }
  return { href: course, kind: 'continue' };
}

function byId<T extends { id: string }>(items: readonly T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

/**
 * The enrolments in the order they came (most recently active first), each with its course.
 * An enrolment whose course was not returned (hidden, archived or deleted) is dropped.
 */
export function continueItems(
  enrollments: readonly Enrollment[],
  courses: readonly Course[],
): ContinueItem[] {
  const coursesById = byId(courses);
  return enrollments
    .flatMap((enrollment) => {
      const course = coursesById.get(enrollment.courseId);
      return course === undefined ? [] : [{ enrollment, course, target: continueTarget(enrollment) }];
    })
    .slice(0, CONTINUE_LIMIT);
}

/** The pathways of the given courses, each once, in the order the courses come. */
export function distinctPathwayIds(courses: readonly Pick<Course, 'pathwayId'>[]): string[] {
  const ids = courses.flatMap((course) => (course.pathwayId === null ? [] : [course.pathwayId]));
  return [...new Set(ids)];
}

/**
 * The student pathways that hold at least one enrolled course, with the number of those
 * courses completed. `pathways` holds null for a pathway that is unknown or unpublished.
 */
export function myPathways(
  enrollments: readonly Enrollment[],
  courses: readonly Course[],
  pathways: readonly (Pathway | null)[],
): PathwayProgressItem[] {
  const coursesById = byId(courses);
  const enrolled = new Map<string, number>();
  const completed = new Map<string, number>();
  for (const enrollment of enrollments) {
    const pathwayId = coursesById.get(enrollment.courseId)?.pathwayId ?? null;
    if (pathwayId === null) continue;
    enrolled.set(pathwayId, (enrolled.get(pathwayId) ?? 0) + 1);
    if (enrollment.status === 'completed') {
      completed.set(pathwayId, (completed.get(pathwayId) ?? 0) + 1);
    }
  }

  const unique = byId(
    pathways.filter(
      (pathway): pathway is Pathway =>
        pathway !== null && pathway.status === 'published' && pathway.audience === 'student',
    ),
  );
  return [...unique.values()]
    .filter((pathway) => (enrolled.get(pathway.id) ?? 0) > 0)
    .sort((a, b) => a.order - b.order)
    .map((pathway) => {
      const done = completed.get(pathway.id) ?? 0;
      return { pathway, completed: done, total: Math.max(pathway.publishedCourseCount, done) };
    });
}

/**
 * Each award with its badge definition, in award order (newest first). An award whose
 * definition is missing (`null`, or not in the list) is dropped.
 */
export function withBadges(
  userBadges: readonly Pick<UserBadge, 'badgeId' | 'awardedAt'>[],
  badges: readonly (Badge | null)[],
): EarnedBadge[] {
  const definitions = byId(badges.filter((badge): badge is Badge => badge !== null));
  return userBadges.flatMap(({ badgeId, awardedAt }) => {
    const badge = definitions.get(badgeId);
    return badge === undefined ? [] : [{ badge, awardedAt }];
  });
}
