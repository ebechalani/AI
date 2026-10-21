import 'server-only';
import { cache } from 'react';
import { requireRole } from '@/lib/auth/session';
import { getCourseOutline } from '@/lib/data/courses';

/** The course with its modules and lessons, read once per request (page and metadata). */
export const loadOutline = cache(async (courseId: string) =>
  getCourseOutline(await requireRole('teacher'), courseId),
);
