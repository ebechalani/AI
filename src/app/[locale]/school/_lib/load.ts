import 'server-only';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { cache } from 'react';
import { requireRole } from '@/lib/auth/session';
import { getClass } from '@/lib/data/classes';
import { getCourseOutline } from '@/lib/data/courses';
import { listSchoolUsers } from '@/lib/data/users';
import { isAppError } from '@/lib/errors';
import { redirect } from '@/lib/i18n/navigation';
import type { Page } from '@/types/common';
import type { CourseOutline } from '@/types/content';
import type { SchoolClass } from '@/types/school';
import type { Session, UserProfile } from '@/types/user';

// Reads shared by the school pages and their `generateMetadata`, each run once per request.

/** The class of the route. */
export const loadClass = cache(async (classId: string) =>
  getClass(await requireRole('school_admin'), classId),
);

/** The area's not-found page for a missing, malformed or other school's resource. */
function notFoundOn(error: unknown): never {
  if (isAppError(error) && (error.code === 'not_found' || error.code === 'forbidden')) {
    notFound();
  }
  throw error;
}

/** The class, or the not-found page (missing, malformed, another school's class). */
export async function classOrNotFound(classId: string): Promise<SchoolClass> {
  try {
    return await loadClass(classId);
  } catch (error) {
    return notFoundOn(error);
  }
}

/** The course outline of the route. */
export const loadOutline = cache(async (courseId: string) =>
  getCourseOutline(await requireRole('school_admin'), courseId),
);

/**
 * The outline, or the not-found page: a missing or malformed id (`not_found`), another school's
 * course or an unpublished official one (`forbidden`).
 */
export async function outlineOrNotFound(courseId: string): Promise<CourseOutline> {
  try {
    return await loadOutline(courseId);
  } catch (error) {
    return notFoundOn(error);
  }
}

const TEACHER_PAGE_SIZE = 100;
const MAX_TEACHER_PAGES = 20;

/** Every teacher of the school (any status): all pages of the School Teachers query. */
export async function listAllSchoolTeachers(
  session: Session,
  schoolId: string,
): Promise<UserProfile[]> {
  const teachers: UserProfile[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < MAX_TEACHER_PAGES; page += 1) {
    const result: Page<UserProfile> = await listSchoolUsers(session, schoolId, 'teacher', {
      limit: TEACHER_PAGE_SIZE,
      cursor,
    });
    teachers.push(...result.items);
    if (result.nextCursor === null) break;
    cursor = result.nextCursor;
  }
  return teachers;
}

/**
 * One page of a cursor-paged list, or a redirect to its first page when the URL's cursor is
 * stale or forged (`ValidationError { cursor: ['invalid'] }`, WS-C's pattern).
 */
export async function pageOrFirst<T>(
  load: () => Promise<Page<T>>,
  firstPageHref: string,
): Promise<Page<T>> {
  try {
    return await load();
  } catch (error) {
    if (isAppError(error) && error.code === 'validation') {
      redirect({ href: firstPageHref, locale: await getLocale() });
    }
    throw error;
  }
}
