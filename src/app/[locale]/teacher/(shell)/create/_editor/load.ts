import 'server-only';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { cache } from 'react';
import type { EditorMode } from '@/components/course-editor/paths';
import type { TrueFalseTexts } from '@/components/course-editor/quiz-model';
import { requireRole } from '@/lib/auth/session';
import { toQuizInput } from '@/lib/data/course-derive';
import { getCourseOutline } from '@/lib/data/courses';
import { hasEnrollments } from '@/lib/data/enrollments';
import { getProject, listProjects } from '@/lib/data/projects';
import { getQuizWithKey, listQuizzes } from '@/lib/data/quizzes';
import { isAppError } from '@/lib/errors';
import { LOCALES } from '@/lib/i18n/config';
import type { Role } from '@/types/common';

// The cached loaders of both editor areas (7.0): a page and its `generateMetadata` read once.
// `cache()` keys on its arguments, so they take primitives (mode, ids), never the session.

export const ROLE: Record<EditorMode, Role> = { teacher: 'teacher', admin: 'platform_admin' };

/** A course the actor may not edit reads as missing: no existence oracle, one not-found page. */
function rethrowHidden(error: unknown): never {
  if (isAppError(error) && (error.code === 'not_found' || error.code === 'forbidden')) notFound();
  throw error;
}

/** The outline and the edit gate (`hasEnrollments` starts with `loadEditableCourse`). */
export const loadEditorCourse = cache(async (mode: EditorMode, courseId: string) => {
  const session = await requireRole(ROLE[mode]);
  try {
    const [outline, locked] = await Promise.all([
      getCourseOutline(session, courseId),
      hasEnrollments(session, courseId),
    ]);
    return { session, outline, locked };
  } catch (error) {
    return rethrowHidden(error);
  }
});

/** The course's quizzes and projects, after the gate. */
export const loadCourseContent = cache(async (mode: EditorMode, courseId: string) => {
  const { session } = await loadEditorCourse(mode, courseId);
  const [quizzes, projects] = await Promise.all([
    listQuizzes(session, courseId),
    listProjects(session, courseId),
  ]);
  return { quizzes, projects };
});

/** One quiz with its answer key, as the editor's input (the key goes to the author only). */
export const loadQuiz = cache(async (mode: EditorMode, courseId: string, quizId: string) => {
  const { session } = await loadEditorCourse(mode, courseId);
  try {
    const { quiz, key } = await getQuizWithKey(session, courseId, quizId);
    return { quiz, input: toQuizInput(quiz, key) };
  } catch (error) {
    return rethrowHidden(error);
  }
});

export const loadProject = cache(async (mode: EditorMode, courseId: string, projectId: string) => {
  const { session } = await loadEditorCourse(mode, courseId);
  try {
    return await getProject(session, courseId, projectId);
  } catch (error) {
    return rethrowHidden(error);
  }
});

/** The default true/false option texts in every editable language (6.4). */
export async function loadTrueFalseTexts(): Promise<TrueFalseTexts> {
  const entries = await Promise.all(
    LOCALES.map(async (locale) => {
      const t = await getTranslations({ locale, namespace: 'courseEditor' });
      return [locale, { true: t('quiz.trueFalse.true'), false: t('quiz.trueFalse.false') }] as const;
    }),
  );
  return Object.fromEntries(entries) as TrueFalseTexts;
}
