// Every teacher URL, locale-less (as `Link`, `LinkButton` and `router.push` take them). Pure, so
// Vitest can import it; the pages and components never inline these paths.

export const TEACHER_PATHS = {
  dashboard: '/teacher',
  classes: '/teacher/classes',
  courses: '/teacher/courses',
  reports: '/teacher/reports',
  settings: '/teacher/settings',
  create: '/teacher/create',
  projects: '/teacher/projects',
} as const;

export type CourseTab = 'catalog' | 'academy' | 'school' | 'mine';

export const JOIN_PATH = '/join';

function withQuery(path: string, params: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined) query.set(name, value);
  }
  const text = query.toString();
  return text === '' ? path : `${path}?${text}`;
}

export function classPath(classId: string): string {
  return `${TEACHER_PATHS.classes}/${classId}`;
}

export function assignPath(classId: string): string {
  return `${classPath(classId)}/assign`;
}

export function studentPath(classId: string, studentUid: string): string {
  return `${classPath(classId)}/students/${studentUid}`;
}

/** The catalog opens on its first tab without a query. */
export function coursesPath(tab?: CourseTab): string {
  return withQuery(TEACHER_PATHS.courses, { tab: tab === 'catalog' ? undefined : tab });
}

export function coursePath(courseId: string): string {
  return `${TEACHER_PATHS.courses}/${courseId}`;
}

export function lessonPath(courseId: string, lessonId: string): string {
  return `${coursePath(courseId)}/lessons/${lessonId}`;
}

/** A course is only meaningful together with its class. */
export function reportPath(classId?: string, courseId?: string): string {
  return withQuery(TEACHER_PATHS.reports, {
    classId,
    courseId: classId === undefined ? undefined : courseId,
  });
}

export function editCoursePath(courseId: string): string {
  return `${TEACHER_PATHS.create}/${courseId}`;
}

export function submissionPath(submissionId: string): string {
  return `${TEACHER_PATHS.projects}/${submissionId}`;
}

export function attemptPath(attemptId: string): string {
  return `/teacher/assessments/${attemptId}`;
}

/** WS-C's filter parameters. */
export function assessmentsPath(classId: string, courseId?: string): string {
  return withQuery('/teacher/assessments', { classId, courseId });
}

export function certificatePath(certificateId: string): string {
  return `/certificates/${certificateId}`;
}

/** A repeated search parameter counts by its first value. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** The share link: the locale-prefixed join page with the code prefilled. */
export function invitePath(localizedJoinPath: string, joinCode: string): string {
  return `${localizedJoinPath}?code=${encodeURIComponent(joinCode)}`;
}
