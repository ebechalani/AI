import 'server-only';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { NEW_ID, type EditorMode } from '@/components/course-editor/paths';
import { pickTranslation } from '@/lib/i18n/content';
import { loadEditorCourse, loadProject, loadQuiz } from './load';

// The `generateMetadata` of every editor page (7.0): the item's title in the UI language.

export async function courseMetadata(mode: EditorMode, courseId: string): Promise<Metadata> {
  const [{ outline }, locale] = await Promise.all([loadEditorCourse(mode, courseId), getLocale()]);
  const { course } = outline;
  return { title: pickTranslation(course.translations, locale, course.defaultLocale).title };
}

export async function lessonMetadata(
  mode: EditorMode,
  courseId: string,
  lessonId: string,
): Promise<Metadata> {
  const [{ outline }, locale] = await Promise.all([loadEditorCourse(mode, courseId), getLocale()]);
  const lesson = outline.lessons.find((candidate) => candidate.id === lessonId);
  if (lesson === undefined) notFound();
  return { title: pickTranslation(lesson.translations, locale, lesson.defaultLocale).title };
}

export async function quizMetadata(
  mode: EditorMode,
  courseId: string,
  quizId: string,
): Promise<Metadata> {
  if (quizId === NEW_ID) {
    await loadEditorCourse(mode, courseId);
    const t = await getTranslations('courseEditor');
    return { title: t('quiz.newTitle') };
  }
  const [{ quiz }, locale] = await Promise.all([loadQuiz(mode, courseId, quizId), getLocale()]);
  return { title: pickTranslation(quiz.translations, locale, quiz.defaultLocale).title };
}

export async function projectMetadata(
  mode: EditorMode,
  courseId: string,
  projectId: string,
): Promise<Metadata> {
  if (projectId === NEW_ID) {
    await loadEditorCourse(mode, courseId);
    const t = await getTranslations('courseEditor');
    return { title: t('project.newTitle') };
  }
  const [project, locale] = await Promise.all([loadProject(mode, courseId, projectId), getLocale()]);
  return { title: pickTranslation(project.translations, locale, project.defaultLocale).title };
}
