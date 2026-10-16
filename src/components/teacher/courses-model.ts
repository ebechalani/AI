import type { Course, Lesson, Module, Pathway } from '@/types/content';
import type { Enrollment } from '@/types/learning';
import type { CourseTab } from './paths';

// The pure model of the teacher's course pages: which catalog tab opens, which courses each tab
// and the assign page offer, and the state of the Teacher Academy and assign panels. The resume
// and outline helpers are E's own copy of WS-B's course model (same semantics). No React.

export function resolveCourseTab(param: string | undefined, hasSchool: boolean): CourseTab {
  if (param === 'academy' || param === 'mine') return param;
  if (param === 'school') return hasSchool ? 'school' : 'catalog';
  return 'catalog';
}

/** Student and Teacher Academy pathways that have published courses, each in `order`. */
export function splitPathways(pathways: readonly Pathway[]): {
  student: Pathway[];
  academy: Pathway[];
} {
  const withCourses = [...pathways]
    .filter((pathway) => pathway.publishedCourseCount > 0)
    .sort((a, b) => a.order - b.order);
  return {
    student: withCourses.filter((pathway) => pathway.audience === 'student'),
    academy: withCourses.filter((pathway) => pathway.audience === 'teacher'),
  };
}

/**
 * The "My school" tab: colleagues' published courses shared with the school. The viewer's own
 * are on "My courses"; a colleague's shared draft is not offered.
 */
export function schoolTabCourses(courses: readonly Course[], viewerUid: string): Course[] {
  return courses.filter((course) => course.ownerUid !== viewerUid && course.status === 'published');
}

/** What `assignCourseToClass` checks before the licence. */
export function isAssignable(course: Pick<Course, 'audience' | 'status'>): boolean {
  return course.audience === 'student' && course.status === 'published';
}

export function progressByCourse(enrollments: readonly Enrollment[]): Record<string, number> {
  return Object.fromEntries(
    enrollments.map((enrollment) => [enrollment.courseId, enrollment.progressPercent]),
  );
}

// ---------------------------------------------------------------------------------------------
// Resume and outline (a copy of WS-B's course-model semantics)

export type ResumeKind = 'start' | 'continue' | 'review';

export interface ResumeTarget {
  lessonId: string;
  kind: ResumeKind;
}

export type LessonState = 'completed' | 'resume' | 'next' | 'todo';

type EnrollmentProgress = Pick<Enrollment, 'completedLessonIds' | 'lastLessonId'>;

/** The lesson the course page sends the teacher to, or null for a course without lessons. */
export function resumeLesson(
  lessons: readonly Pick<Lesson, 'id'>[],
  enrollment: EnrollmentProgress | null,
): ResumeTarget | null {
  const first = lessons[0];
  if (first === undefined) return null;
  if (enrollment === null) return { lessonId: first.id, kind: 'start' };

  const done = new Set(enrollment.completedLessonIds);
  const { lastLessonId } = enrollment;
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

/** `completed` for done lessons; the next lesson is `resume` (opened before) or `next`. */
export function lessonStates(
  lessons: readonly Pick<Lesson, 'id'>[],
  enrollment: EnrollmentProgress | null,
  resume: ResumeTarget | null,
): Map<string, LessonState> {
  const done = new Set(enrollment?.completedLessonIds ?? []);
  const resumeId =
    enrollment !== null && resume !== null && resume.kind !== 'review' ? resume.lessonId : null;
  const stateOf = (id: string): LessonState => {
    if (done.has(id)) return 'completed';
    if (id !== resumeId) return 'todo';
    return id === enrollment?.lastLessonId ? 'resume' : 'next';
  };
  return new Map(lessons.map((lesson): [string, LessonState] => [lesson.id, stateOf(lesson.id)]));
}

export interface ModuleGroup {
  module: Module;
  /** 1-based, in module order. */
  number: number;
  lessons: Lesson[];
}

/** Modules with their lessons in order; a module without lessons is left out. */
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

// ---------------------------------------------------------------------------------------------
// Course detail panels

export type AcademyPanelState = 'locked' | 'draft' | 'enroll' | 'active' | 'completed';

/** An enrollment's progress is shown even when the licence has lapsed. */
export function academyPanelState(
  course: Pick<Course, 'status'>,
  enrollment: Pick<Enrollment, 'status'> | null,
  accessAllowed: boolean,
): AcademyPanelState {
  if (enrollment?.status === 'completed') return 'completed';
  if (enrollment?.status === 'active') return 'active';
  if (!accessAllowed) return 'locked';
  if (course.status !== 'published') return 'draft';
  return 'enroll';
}

export type AssignPanelState = 'locked' | 'notPublished' | 'noClasses' | 'ready';

export function assignPanelState(
  course: Pick<Course, 'status'>,
  accessAllowed: boolean,
  activeClassCount: number,
): AssignPanelState {
  if (!accessAllowed) return 'locked';
  if (course.status !== 'published') return 'notPublished';
  if (activeClassCount === 0) return 'noClasses';
  return 'ready';
}
