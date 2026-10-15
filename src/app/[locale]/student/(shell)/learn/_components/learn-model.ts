import type { Course, Pathway } from '@/types/content';
import type { Enrollment } from '@/types/learning';

// The pure model of /student/learn (ARCHITECTURE.md 6.4): the student's courses split by
// status, and the completed courses per pathway for the catalog. Types only, so Vitest can
// import it.

export interface MyCourse {
  enrollment: Enrollment;
  course: Course;
}

export interface MyCourses {
  inProgress: MyCourse[];
  completed: MyCourse[];
}

/**
 * Pairs each enrolment with its course, in the enrolments' order (most recent activity
 * first). An enrolment whose course is missing or hidden (`getCourses` drops it) is left out.
 */
export function splitMyCourses(
  enrollments: readonly Enrollment[],
  courses: readonly Course[],
): MyCourses {
  const byId = new Map(courses.map((course) => [course.id, course]));
  const inProgress: MyCourse[] = [];
  const completed: MyCourse[] = [];
  for (const enrollment of enrollments) {
    const course = byId.get(enrollment.courseId);
    if (course === undefined) continue;
    (enrollment.status === 'completed' ? completed : inProgress).push({ enrollment, course });
  }
  return { inProgress, completed };
}

/**
 * The number of completed courses per pathway, for each pathway in which the student is
 * enrolled in at least one course (0 when none is completed yet). Pathways without an
 * enrolment are absent, so their card shows no progress.
 */
export function pathwayProgress(
  enrollments: readonly Enrollment[],
  courses: readonly Course[],
): Map<string, number> {
  const pathwayOf = new Map(courses.map((course) => [course.id, course.pathwayId]));
  const progress = new Map<string, number>();
  for (const enrollment of enrollments) {
    const pathwayId = pathwayOf.get(enrollment.courseId);
    if (pathwayId === undefined || pathwayId === null) continue;
    const completed = enrollment.status === 'completed' ? 1 : 0;
    progress.set(pathwayId, (progress.get(pathwayId) ?? 0) + completed);
  }
  return progress;
}

/**
 * The `PathwayCard` progress: undefined without an enrolment in the pathway. The total never
 * falls below the completed count (a course completed and later unpublished still counts), the
 * same formula as the Student Home, so both pages print the same "x of y".
 */
export function pathwayCardProgress(
  pathway: Pick<Pathway, 'id' | 'publishedCourseCount'>,
  progress: ReadonlyMap<string, number>,
): { completed: number; total: number } | undefined {
  const completed = progress.get(pathway.id);
  if (completed === undefined) return undefined;
  return { completed, total: Math.max(pathway.publishedCourseCount, completed) };
}
