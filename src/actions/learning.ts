'use server';

import { runAction } from '@/lib/actions/run-action';
import { getCourseOutline } from '@/lib/data/courses';
import {
  enrollInCourseInputSchema,
  lessonRefInputSchema,
  saveBlockResponseInputSchema,
} from '@/lib/schemas/learning';
import { completeLesson, enrollSelf, saveResponse, startLesson } from '@/lib/services/learning';
import type { ActionResult } from '@/types/actions';
import type { Role } from '@/types/common';
import type { EnrollInCourseInput, LessonRefInput, SaveBlockResponseInput } from '@/types/inputs';
import type { LessonCompletionResult } from '@/types/learning';

// Enrolling and learning (ARCHITECTURE.md 10.4). The role gate is coarse: the learning service
// decides whether the actor learns this course (a student in a student course, a teacher in a
// Teacher Academy course) and answers forbidden, not_found, conflict or license_required.

const LEARNERS: readonly Role[] = ['student', 'teacher'];

/** Enrols the actor in a course (idempotent) and names its first lesson, for the redirect. */
export async function enrollInCourseAction(
  input: EnrollInCourseInput,
): Promise<ActionResult<{ enrollmentId: string; firstLessonId: string | null }>> {
  return runAction(
    enrollInCourseInputSchema,
    input,
    async ({ courseId }, session) => {
      const enrollment = await enrollSelf(session, courseId);
      // Sorted by module, then by order: the first lesson of the course.
      const { lessons } = await getCourseOutline(session, courseId);
      return { enrollmentId: enrollment.id, firstLessonId: lessons[0]?.id ?? null };
    },
    { roles: LEARNERS },
  );
}

/** The player's start beacon: the progress document and the enrollment's "continue" target. */
export async function startLessonAction(input: LessonRefInput): Promise<ActionResult<null>> {
  return runAction(
    lessonRefInputSchema,
    input,
    async ({ courseId, lessonId }, session) => {
      await startLesson(session, courseId, lessonId);
      return null;
    },
    { roles: LEARNERS },
  );
}

/** A reflection or code-activity response, saved as typed (the schema does not trim it). */
export async function saveBlockResponseAction(
  input: SaveBlockResponseInput,
): Promise<ActionResult<null>> {
  return runAction(
    saveBlockResponseInputSchema,
    input,
    async ({ courseId, lessonId, blockId, text }, session) => {
      await saveResponse(session, courseId, lessonId, blockId, text);
      return null;
    },
    { roles: LEARNERS },
  );
}

/**
 * Completes the lesson when nothing is missing (9.4). The service's answer is returned as is:
 * `completed: false` lists what is missing, `completed: true` carries what was earned.
 */
export async function completeLessonAction(
  input: LessonRefInput,
): Promise<ActionResult<LessonCompletionResult>> {
  return runAction(
    lessonRefInputSchema,
    input,
    async ({ courseId, lessonId }, session) => completeLesson(session, courseId, lessonId),
    { roles: LEARNERS },
  );
}
