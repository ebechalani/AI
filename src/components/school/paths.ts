// Every URL of the school admin's area, locale-less (`Link`, `LinkButton` and `router.push` add
// the locale). Pages and components build their links here, never inline (ARCHITECTURE.md 6.6).

export const SCHOOL_PATHS = {
  dashboard: '/school',
  teachers: '/school/teachers',
  students: '/school/students',
  classes: '/school/classes',
  courses: '/school/courses',
  analytics: '/school/analytics',
  certificates: '/school/certificates',
  licenses: '/school/licenses',
  settings: '/school/settings',
} as const;

export function schoolClassPath(classId: string): string {
  return `${SCHOOL_PATHS.classes}/${classId}`;
}

/** Assign a course to the class (WS-G-1). */
export function schoolAssignPath(classId: string): string {
  return `${schoolClassPath(classId)}/assign`;
}

/** The course detail with its outline and preview links (WS-G-1). */
export function schoolCoursePath(courseId: string): string {
  return `${SCHOOL_PATHS.courses}/${courseId}`;
}

/** WS-B's read-only lesson player; its exit leads back to the school's course list. */
export function previewLessonPath(courseId: string, lessonId: string): string {
  return `/preview/${courseId}/lessons/${lessonId}`;
}

/** WS-J's printable certificate; its back link leads a school admin to the certificates list. */
export function certificatePath(certificateId: string): string {
  return `/certificates/${certificateId}`;
}

export const JOIN_PATH = '/join';

/** The share link of `JoinCodePanel`: the locale-prefixed join page with the code. */
export function invitePath(localizedJoinPath: string, joinCode: string): string {
  return `${localizedJoinPath}?code=${encodeURIComponent(joinCode)}`;
}

/** A repeated search parameter counts by its first value. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
