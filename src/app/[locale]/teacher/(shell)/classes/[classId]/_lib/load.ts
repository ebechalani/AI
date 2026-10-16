import 'server-only';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { requireRole } from '@/lib/auth/session';
import { getClass } from '@/lib/data/classes';
import { isAppError } from '@/lib/errors';
import { getStudentForTeacher } from '@/lib/services/classroom';
import type { SchoolClass } from '@/types/school';

// The class and the pupil, read once per request: the detail, assign and pupil pages share
// these with their `generateMetadata`.

export const loadClass = cache(async (classId: string) =>
  getClass(await requireRole('teacher'), classId),
);

/** The class, or the not-found page for a missing, malformed or hidden one. */
export async function classOrNotFound(classId: string): Promise<SchoolClass> {
  try {
    return await loadClass(classId);
  } catch (error) {
    if (isAppError(error) && (error.code === 'not_found' || error.code === 'forbidden')) {
      notFound();
    }
    throw error;
  }
}

export const loadStudent = cache(async (classId: string, studentUid: string) =>
  getStudentForTeacher(await requireRole('teacher'), classId, studentUid),
);
