import type { Course, Lesson, Module } from '@/types/content';
import type { Enrollment } from '@/types/learning';

// The pure model of /student/learn/courses/[courseId]: where the primary button leads, the
// state of each lesson in the outline, and which "unavailable" view a hidden course gets.
// Types only, so Vitest can import it.

export type ResumeKind = 'start' | 'continue' | 'review';

export interface ResumeTarget {
  lessonId: string;
  kind: ResumeKind;
}

export type LessonState = 'completed' | 'resume' | 'todo';

type EnrollmentProgress = Pick<Enrollment, 'completedLessonIds' | 'lastLessonId'>;

/** The lesson the course page sends the student to, or null for a course without lessons. */
export function resumeLesson(
  lessons: readonly Pick<Lesson, 'id'>[],
  enrollment: EnrollmentProgress | null,
): ResumeTarget | null {
  const first = lessons[0];
  if (first === undefined) return null;
  if (enrollment === null) return { lessonId: first.id, kind: 'start' };

  const done = new Set(enrollment.completedLessonIds);
  const { lastLessonId } = enrollment;
  // The lesson last opened, when it still exists and is not done yet.
  if (
    lastLessonId !== null &&
    !done.has(lastLessonId) &&
    lessons.some((lesson) => lesson.id === lastLessonId)
  ) {
    return { lessonId: lastLessonId, kind: 'continue' };
  }
  const next = lessons.find((lesson) => !done.has(lesson.id));
  if (next !== undefined) {
    const fresh = enrollment.completedLessonIds.length === 0 && lastLessonId === null;
    return { lessonId: next.id, kind: fresh ? 'start' : 'continue' };
  }
  return { lessonId: first.id, kind: 'review' };
}

/** `completed` for done lessons, `resume` for the enrolled student's next lesson, else `todo`. */
export function lessonStates(
  lessons: readonly Pick<Lesson, 'id'>[],
  enrollment: EnrollmentProgress | null,
  resume: ResumeTarget | null,
): Map<string, LessonState> {
  const done = new Set(enrollment?.completedLessonIds ?? []);
  const resumeId =
    enrollment !== null && resume !== null && resume.kind !== 'review' ? resume.lessonId : null;
  return new Map(
    lessons.map((lesson): [string, LessonState] => [
      lesson.id,
      done.has(lesson.id) ? 'completed' : lesson.id === resumeId ? 'resume' : 'todo',
    ]),
  );
}

export interface ModuleGroup {
  module: Module;
  /** 1-based, in module order. */
  number: number;
  lessons: Lesson[];
}

/**
 * The outline's modules, each with its lessons in order (the outline already sorts both).
 * Modules without lessons are left out: they have nothing to open.
 */
export function groupLessonsByModule(
  modules: readonly Module[],
  lessons: readonly Lesson[],
): ModuleGroup[] {
  return modules
    .map((module, index) => ({
      module,
      number: index + 1,
      lessons: lessons.filter((lesson) => lesson.moduleId === module.id),
    }))
    .filter((group) => group.lessons.length > 0);
}

export type ForbiddenCourseView = 'teacherOnly' | 'unavailable';

/**
 * A course the student may not open (`forbidden`): a published Teacher Academy course gets its
 * own explanation; anything else (draft, archived, another school's course) is "unavailable".
 */
export function forbiddenCourseView(
  published: Pick<Course, 'audience'> | null,
): ForbiddenCourseView {
  return published?.audience === 'teacher' ? 'teacherOnly' : 'unavailable';
}

export function lessonHref(courseId: string, lessonId: string): string {
  return `/student/learn/courses/${courseId}/lessons/${lessonId}`;
}
