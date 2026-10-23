import type { CourseUsageRow } from '@/types/analytics';
import type { Course, CourseOutline, Lesson, Module, Pathway } from '@/types/content';
import type { SchoolClass } from '@/types/school';

// The catalog as a school admin sees it: the pathways by audience, the usage per course, what
// the assign page offers, and a course outline grouped by module. No React, so Vitest can
// import it.

/** Pathways with published courses, in order, split by audience. */
export function splitCatalog(pathways: readonly Pathway[]): {
  student: Pathway[];
  academy: Pathway[];
} {
  const listed = pathways
    .filter((pathway) => pathway.publishedCourseCount > 0)
    .sort((a, b) => a.order - b.order);
  return {
    student: listed.filter((pathway) => pathway.audience === 'student'),
    academy: listed.filter((pathway) => pathway.audience === 'teacher'),
  };
}

export function usageByCourse(rows: readonly CourseUsageRow[]): Map<string, CourseUsageRow> {
  return new Map(rows.map((row) => [row.courseId, row]));
}

/** What `assignCourseToClass` accepts before its licence check: a published student course. */
export function isAssignable(course: Pick<Course, 'audience' | 'status'>): boolean {
  return course.audience === 'student' && course.status === 'published';
}

/**
 * The teacher-made courses the assign page offers: assignable and shared with the school. A
 * course "private to its author" stays its author's (SPEC-G 12.2 Q12), although
 * `assignCourseToClass` would accept it from a school admin.
 */
export function isAssignableSchoolCourse(
  course: Pick<Course, 'audience' | 'status' | 'visibility'>,
): boolean {
  return isAssignable(course) && course.visibility === 'school';
}

/** The first lesson of the outline (its lessons are sorted by module, then order), or null. */
export function firstLessonId(outline: Pick<CourseOutline, 'lessons'>): string | null {
  return outline.lessons[0]?.id ?? null;
}

export interface LessonGroup {
  /** null: lessons whose module is not in the outline. */
  module: Module | null;
  lessons: Lesson[];
}

/** The modules in order with their lessons in order; orphan lessons form a last group. */
export function groupLessons(
  modules: readonly Module[],
  lessons: readonly Lesson[],
): LessonGroup[] {
  const sortedModules = [...modules].sort((a, b) => a.order - b.order);
  const known = new Set(sortedModules.map((module) => module.id));
  const byOrder = (a: Lesson, b: Lesson) => a.order - b.order;
  const groups: LessonGroup[] = sortedModules.map((module) => ({
    module,
    lessons: lessons.filter((lesson) => lesson.moduleId === module.id).sort(byOrder),
  }));
  const orphans = lessons.filter((lesson) => !known.has(lesson.moduleId));
  if (orphans.length > 0) groups.push({ module: null, lessons: [...orphans].sort(byOrder) });
  return groups;
}

/** The active classes that have the course assigned, by name. */
export function classesWithCourse(
  classes: readonly SchoolClass[],
  courseId: string,
): SchoolClass[] {
  return classes
    .filter((cls) => !cls.archived && cls.assignedCourseIds.includes(courseId))
    .sort((a, b) => a.name.localeCompare(b.name));
}
