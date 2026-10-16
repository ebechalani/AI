import 'server-only';
import type { TutorCourseOption } from '@/components/ai/TutorWorkspace';
import { getCourses } from '@/lib/data/courses';
import { listEnrollmentsForUser } from '@/lib/data/enrollments';
import { getSchool } from '@/lib/data/schools';
import { NotFoundError } from '@/lib/errors';
import { pickTranslation } from '@/lib/i18n/content';
import type { Locale } from '@/types/common';
import type { Session } from '@/types/user';

export type { TutorCourseOption };

export interface TutorPageData {
  aiEnabled: boolean;
  courses: TutorCourseOption[];
  initialCourseId: string | null;
}

/** The school's AI switch, as checkAndCountAiUsage applies it: a missing school is off. */
async function schoolAllowsAi(session: Session): Promise<boolean> {
  if (session.schoolId === null) return true;
  try {
    return (await getSchool(session, session.schoolId)).settings.aiEnabled === true;
  } catch (error: unknown) {
    if (error instanceof NotFoundError) return false;
    throw error;
  }
}

/**
 * /student/tutor (3.7 "Student AI Tutor"): the school (only with one) and, when the AI is on,
 * the Student Learn enrolment query and its courses for the course selector. `?course=` only
 * preselects one of the learner's courses; anything else is ignored.
 */
export async function loadTutorPage(
  session: Session,
  locale: Locale,
  courseParam: string | string[] | undefined,
): Promise<TutorPageData> {
  if (!(await schoolAllowsAi(session))) {
    return { aiEnabled: false, courses: [], initialCourseId: null };
  }
  const enrollments = await listEnrollmentsForUser(session, session.uid);
  const courses =
    enrollments.length === 0
      ? []
      : await getCourses(
          session,
          enrollments.map((enrollment) => enrollment.courseId),
        );
  const byId = new Map(courses.map((course) => [course.id, course]));
  const options = enrollments.flatMap((enrollment): TutorCourseOption[] => {
    const course = byId.get(enrollment.courseId);
    if (course === undefined) return [];
    const { title } = pickTranslation(course.translations, locale, course.defaultLocale);
    return [{ id: course.id, title }];
  });
  const initialCourseId =
    typeof courseParam === 'string' && options.some((option) => option.id === courseParam)
      ? courseParam
      : null;
  return { aiEnabled: true, courses: options, initialCourseId };
}
