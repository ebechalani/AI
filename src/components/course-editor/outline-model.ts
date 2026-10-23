import { hasTranslation } from '@/lib/i18n/content';
import { getPublishProblems, type PublishProblem } from '@/lib/learning/publish-readiness';
import type { Locale } from '@/types/common';
import type { Course, CourseStatus, Lesson, LessonBlock } from '@/types/content';
import type { LessonRow, ModuleRow, ProjectRow, QuizRow } from './rows';
import { EDITABLE_LOCALES } from './translations';

// The course page's publishing panel and outline (6.2.2, 6.2.3), and the lesson page's
// requirements (6.3.1).

/** The server's rule (WS-F-2): the same function runs in `setCourseStatus`. */
export type ReadinessBlocker = PublishProblem;

export type ReadinessWarning =
  | { kind: 'untranslated'; locale: Locale; course: boolean; modules: number; lessons: number }
  | { kind: 'unused_quizzes'; count: number }
  | { kind: 'unused_projects'; count: number }
  | { kind: 'no_cover' };

export interface Readiness {
  blockers: ReadinessBlocker[];
  warnings: ReadinessWarning[];
}

export function courseReadiness(input: {
  course: Course;
  modules: readonly ModuleRow[];
  lessons: readonly LessonRow[];
  quizzes: readonly QuizRow[];
  projects: readonly ProjectRow[];
}): Readiness {
  const { course, modules, lessons, quizzes, projects } = input;
  const blockers = getPublishProblems({ modules, lessons });
  const warnings: ReadinessWarning[] = [];

  for (const locale of EDITABLE_LOCALES) {
    if (locale === course.defaultLocale) continue;
    const courseMissing = !hasTranslation(course.translations, locale);
    const moduleCount = modules.filter((row) => !hasTranslation(row.translations, locale)).length;
    const lessonCount = lessons.filter((row) => !hasTranslation(row.translations, locale)).length;
    if (courseMissing || moduleCount > 0 || lessonCount > 0) {
      warnings.push({
        kind: 'untranslated',
        locale,
        course: courseMissing,
        modules: moduleCount,
        lessons: lessonCount,
      });
    }
  }
  const unusedQuizzes = quizzes.filter((quiz) => quiz.lessonId === null).length;
  if (unusedQuizzes > 0) warnings.push({ kind: 'unused_quizzes', count: unusedQuizzes });
  const unusedProjects = projects.filter((project) => project.lessonId === null).length;
  if (unusedProjects > 0) warnings.push({ kind: 'unused_projects', count: unusedProjects });
  if (course.coverImage === null) warnings.push({ kind: 'no_cover' });

  return { blockers, warnings };
}

export type StatusAction = 'publish' | 'unpublish' | 'archive' | 'restore';
export const STATUS_ACTIONS: readonly StatusAction[] = ['publish', 'unpublish', 'archive', 'restore'];

export function statusActions(status: CourseStatus): StatusAction[] {
  switch (status) {
    case 'draft':
      return ['publish', 'archive'];
    case 'published':
      return ['unpublish', 'archive'];
    default:
      return ['restore'];
  }
}

export function targetStatus(action: StatusAction): CourseStatus {
  switch (action) {
    case 'publish':
      return 'published';
    case 'archive':
      return 'archived';
    default:
      return 'draft';
  }
}

export type StatusExplanation =
  | 'draft'
  | 'publishedPrivate'
  | 'publishedSchool'
  | 'publishedForTeachers'
  | 'publishedOfficial'
  | 'archived';
export const STATUS_EXPLANATIONS: readonly StatusExplanation[] = [
  'draft',
  'publishedPrivate',
  'publishedSchool',
  'publishedForTeachers',
  'publishedOfficial',
  'archived',
];

/**
 * The sentence under the status chip. A course for teachers is never assigned to a class
 * (teachers enrol themselves), whatever its visibility.
 */
export function statusExplanation(
  course: Pick<Course, 'status' | 'isOfficial' | 'visibility' | 'audience'>,
): StatusExplanation {
  if (course.status === 'draft') return 'draft';
  if (course.status === 'archived') return 'archived';
  if (course.isOfficial) return 'publishedOfficial';
  if (course.audience === 'teacher') return 'publishedForTeachers';
  return course.visibility === 'school' ? 'publishedSchool' : 'publishedPrivate';
}

/** `id` moved to `toIndex` (clamped); an unknown id gives an unchanged copy. */
export function moveId(ids: readonly string[], id: string, toIndex: number): string[] {
  const from = ids.indexOf(id);
  if (from === -1) return [...ids];
  const rest = ids.filter((_, index) => index !== from);
  const target = Math.min(Math.max(Math.trunc(toIndex), 0), rest.length);
  rest.splice(target, 0, id);
  return rest;
}

/** One step up or down; null at an edge (or for an unknown id). */
export function moveResult(
  ids: readonly string[],
  id: string,
  delta: -1 | 1,
): { orderedIds: string[]; index: number } | null {
  const from = ids.indexOf(id);
  const index = from + delta;
  if (from === -1 || index < 0 || index >= ids.length) return null;
  return { orderedIds: moveId(ids, id, index), index };
}

/**
 * What a learner must do to complete the lesson (ARCHITECTURE.md 9.4). A reflection with
 * `minLength` 0 needs no saved response, so it is not a requirement.
 */
export function lessonRequirements(
  lesson: Pick<Lesson, 'quizIds' | 'projectIds' | 'reflectionBlockIds'>,
  blocks: readonly LessonBlock[],
): { quizzes: number; projects: number; reflections: number } {
  return {
    quizzes: lesson.quizIds.length,
    projects: lesson.projectIds.length,
    reflections: blocks.filter((block) => block.type === 'reflection' && block.data.minLength > 0)
      .length,
  };
}
