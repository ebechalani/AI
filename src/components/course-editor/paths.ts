// Every course-editor URL, locale-less (as `Link`, `LinkButton` and `router.push` take them).
// Pure, so Vitest can import it; pages and components never inline these paths.

export type EditorMode = 'teacher' | 'admin';
export type CourseTab = 'outline' | 'details' | 'content';

/** Reserved in `quizzes/[quizId]` and `projects/[projectId]`: the editor of a new one (WS-F-1). */
export const NEW_ID = 'new';

const COURSE_TABS: readonly CourseTab[] = ['outline', 'details', 'content'];

export interface EditorPaths {
  /** '/teacher/create' | '/admin/courses' */
  list: string;
  /** 'outline' or no tab → no query; else `?tab=details|content`. */
  course(courseId: string, tab?: CourseTab): string;
  lesson(courseId: string, lessonId: string): string;
  quiz(courseId: string, quizId: string): string;
  /** …/quizzes/new[?lesson=<encoded id>] */
  newQuiz(courseId: string, lessonId?: string): string;
  project(courseId: string, projectId: string): string;
  newProject(courseId: string, lessonId?: string): string;
  /**
   * The read-only preview of a lesson. Teacher: WS-E's player route, read-only for an owner who
   * is not enrolled. Admin: WS-B's preview.
   */
  preview(courseId: string, lessonId: string): string;
}

function withLesson(path: string, lessonId: string | undefined): string {
  return lessonId === undefined ? path : `${path}?lesson=${encodeURIComponent(lessonId)}`;
}

export function editorPaths(mode: EditorMode): EditorPaths {
  const list = mode === 'teacher' ? '/teacher/create' : '/admin/courses';
  const base = (courseId: string) => `${list}/${courseId}`;
  return {
    list,
    course: (courseId, tab) =>
      tab === undefined || tab === 'outline' ? base(courseId) : `${base(courseId)}?tab=${tab}`,
    lesson: (courseId, lessonId) => `${base(courseId)}/lessons/${lessonId}`,
    quiz: (courseId, quizId) => `${base(courseId)}/quizzes/${quizId}`,
    newQuiz: (courseId, lessonId) => withLesson(`${base(courseId)}/quizzes/${NEW_ID}`, lessonId),
    project: (courseId, projectId) => `${base(courseId)}/projects/${projectId}`,
    newProject: (courseId, lessonId) =>
      withLesson(`${base(courseId)}/projects/${NEW_ID}`, lessonId),
    preview: (courseId, lessonId) =>
      mode === 'teacher'
        ? `/teacher/courses/${courseId}/lessons/${lessonId}`
        : `/preview/${courseId}/lessons/${lessonId}`,
  };
}

/** A repeated search parameter counts by its first value. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** The course page's tab from `?tab=`; anything unknown is the outline. */
export function parseCourseTab(value: string | string[] | undefined): CourseTab {
  const first = firstParam(value);
  return (COURSE_TABS as readonly string[]).includes(first ?? '') ? (first as CourseTab) : 'outline';
}

/** Element ids the editor focuses or scrolls to. */
export const anchors = {
  /** The module's h3 (tabIndex -1). */
  module: (id: string) => `module-${id}`,
  /** The lesson row's link. */
  lesson: (id: string) => `lesson-${id}`,
  /** The block summary's heading (tabIndex -1). */
  block: (id: string) => `block-${id}`,
  /** The block summary's Edit button: where the focus goes when its form closes. */
  blockEdit: (id: string) => `block-${id}-edit`,
  question: (key: string) => `question-${key}`,
  readiness: 'course-readiness',
  outline: 'course-outline',
  blocks: 'lesson-blocks',
  /** The lesson's "Add a block" button (one is shown at a time). */
  addBlock: 'lesson-blocks-add',
  questions: 'quiz-questions',
} as const;

/** The details panel's heading, the cover card and the content panel's heading (tabIndex -1). */
export const DETAILS_ANCHOR = 'course-details';
export const COVER_ANCHOR = 'course-cover';
export const CONTENT_ANCHOR = 'course-content';
