import type { Lesson, Module } from '@/types/content';

/** One thing that stops a course from being published (ARCHITECTURE.md 10.1, 10.2). */
export type PublishProblem =
  | { kind: 'no_modules' }
  | { kind: 'empty_module'; moduleId: string }
  | { kind: 'empty_lesson'; lessonId: string };

export interface PublishOutline {
  modules: readonly Pick<Module, 'id' | 'order'>[];
  lessons: readonly Pick<Lesson, 'id' | 'moduleId' | 'order' | 'blockCount'>[];
}

function byOrder(a: { order: number }, b: { order: number }): number {
  return a.order - b.order;
}

/**
 * What is missing before a course may be published, in the order an author meets it in the
 * outline; `[]` when it is ready. A course needs a module, every module a lesson and every
 * lesson a block:
 * - no module at all gives `no_modules` alone;
 * - otherwise, module by module (by `order`), a module without lessons gives `empty_module`,
 *   and each lesson of a module (by `order`) whose `blockCount` is 0 gives `empty_lesson`.
 *
 * The same rule runs in `data/courses.setCourseStatus` (the server's check) and in the course
 * editor's readiness list, so both always agree. A lesson whose module is not in `modules` is
 * not looked at. The inputs are not changed.
 */
export function getPublishProblems(outline: PublishOutline): PublishProblem[] {
  if (outline.modules.length === 0) return [{ kind: 'no_modules' }];

  const problems: PublishProblem[] = [];
  for (const courseModule of [...outline.modules].sort(byOrder)) {
    const lessons = outline.lessons
      .filter((lesson) => lesson.moduleId === courseModule.id)
      .sort(byOrder);
    if (lessons.length === 0) {
      problems.push({ kind: 'empty_module', moduleId: courseModule.id });
      continue;
    }
    for (const lesson of lessons) {
      if (lesson.blockCount === 0) problems.push({ kind: 'empty_lesson', lessonId: lesson.id });
    }
  }
  return problems;
}
