import type { Course } from '@/types/content';
import type { Enrollment } from '@/types/learning';

// The pure model of /student/learn/pathways/[pathwayId]: the student's own progress over the
// pathway's courses. Types only, so Vitest can import it.

export interface PathwayCourseProgress {
  /** Courses of the pathway the student is enrolled in. */
  enrolled: number;
  /** Of those, the completed ones. */
  completed: number;
  /** Courses of the pathway shown on the page. */
  total: number;
}

export function pathwayCourseProgress(
  courses: readonly Course[],
  byCourse: ReadonlyMap<string, Enrollment>,
): PathwayCourseProgress {
  let enrolled = 0;
  let completed = 0;
  for (const course of courses) {
    const enrollment = byCourse.get(course.id);
    if (enrollment === undefined) continue;
    enrolled += 1;
    if (enrollment.status === 'completed') completed += 1;
  }
  return { enrolled, completed, total: courses.length };
}

/** 0–100, and 0 for a pathway without courses (no division by zero). */
export function progressPercent(completed: number, total: number): number {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}
