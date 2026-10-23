import type { Audience, Locale, Localized } from '@/types/common';
import type { Lesson, Module, Pathway } from '@/types/content';
import type { HardwarePlatform } from '@/types/hardware';
import type { Project, ProjectKind } from '@/types/project';
import type { Quiz } from '@/types/quiz';

// The slim view models the pages hand to client components: only what the editor shows, so a
// quiz's questions or a lesson's tutor excerpt are never serialised into a list.

export type ModuleRow = Pick<
  Module,
  'id' | 'order' | 'lessonCount' | 'defaultLocale' | 'translations'
>;

export type LessonRow = Pick<
  Lesson,
  | 'id'
  | 'moduleId'
  | 'order'
  | 'estimatedMinutes'
  | 'xpReward'
  | 'blockCount'
  | 'quizIds'
  | 'projectIds'
  | 'reflectionBlockIds'
  | 'defaultLocale'
  | 'translations'
>;

export interface QuizRow {
  id: string;
  lessonId: string | null;
  questionCount: number;
  defaultLocale: Locale;
  translations: Localized<{ title: string }>;
}

export interface ProjectRow {
  id: string;
  lessonId: string | null;
  kind: ProjectKind;
  defaultLocale: Locale;
  translations: Localized<{ title: string }>;
}

export interface PlatformOption {
  id: string;
  isActive: boolean;
  defaultLocale: Locale;
  translations: Localized<{ name: string }>;
}

export interface PathwayOption {
  id: string;
  audience: Audience;
  status: 'draft' | 'published';
  order: number;
  defaultLocale: Locale;
  translations: Localized<{ title: string }>;
}

/** Quiz and project rows by id, for block summaries and links. */
export interface CourseLookups {
  quizzes: Record<string, QuizRow>;
  projects: Record<string, ProjectRow>;
}

function pickField<K extends string>(
  translations: Localized<Record<K, unknown>>,
  field: K,
): Localized<Record<K, string>> {
  const result: Localized<Record<K, string>> = {};
  for (const [locale, entry] of Object.entries(translations)) {
    if (entry === undefined) continue;
    const value = entry[field];
    result[locale] = { [field]: typeof value === 'string' ? value : '' } as Record<K, string>;
  }
  return result;
}

export function toModuleRow(module: Module): ModuleRow {
  return {
    id: module.id,
    order: module.order,
    lessonCount: module.lessonCount,
    defaultLocale: module.defaultLocale,
    translations: module.translations,
  };
}

export function toLessonRow(lesson: Lesson): LessonRow {
  return {
    id: lesson.id,
    moduleId: lesson.moduleId,
    order: lesson.order,
    estimatedMinutes: lesson.estimatedMinutes,
    xpReward: lesson.xpReward,
    blockCount: lesson.blockCount,
    quizIds: lesson.quizIds,
    projectIds: lesson.projectIds,
    reflectionBlockIds: lesson.reflectionBlockIds,
    defaultLocale: lesson.defaultLocale,
    translations: lesson.translations,
  };
}

export function toQuizRow(quiz: Quiz): QuizRow {
  return {
    id: quiz.id,
    lessonId: quiz.lessonId,
    questionCount: quiz.questionCount,
    defaultLocale: quiz.defaultLocale,
    translations: pickField(quiz.translations, 'title'),
  };
}

export function toProjectRow(project: Project): ProjectRow {
  return {
    id: project.id,
    lessonId: project.lessonId,
    kind: project.kind,
    defaultLocale: project.defaultLocale,
    translations: pickField(project.translations, 'title'),
  };
}

export function toPlatformOption(platform: HardwarePlatform): PlatformOption {
  return {
    id: platform.id,
    isActive: platform.isActive,
    defaultLocale: platform.defaultLocale,
    translations: pickField(platform.translations, 'name'),
  };
}

export function toPathwayOption(pathway: Pathway): PathwayOption {
  return {
    id: pathway.id,
    audience: pathway.audience,
    status: pathway.status,
    order: pathway.order,
    defaultLocale: pathway.defaultLocale,
    translations: pickField(pathway.translations, 'title'),
  };
}

/** Rows by id. */
export function byId<R extends { id: string }>(rows: readonly R[]): Record<string, R> {
  return Object.fromEntries(rows.map((row) => [row.id, row]));
}
