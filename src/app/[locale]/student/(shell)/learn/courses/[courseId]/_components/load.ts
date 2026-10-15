import 'server-only';
import { cache } from 'react';
import { requireRole } from '@/lib/auth/session';
import { getCourseOutline } from '@/lib/data/courses';

/** One outline read per request, shared by `generateMetadata` and the page. */
export const loadOutline = cache(async (courseId: string) => {
  const session = await requireRole('student');
  return getCourseOutline(session, courseId);
});
