'use server';

// Stubs (F8): the signatures and roles of ARCHITECTURE.md 10.4; WS-B fills them in.

import { runAction } from '@/lib/actions/run-action';
import { AppError } from '@/lib/errors';
import {
  enrollInCourseInputSchema,
  lessonRefInputSchema,
  saveBlockResponseInputSchema,
} from '@/lib/schemas/learning';
import type { ActionResult } from '@/types/actions';
import type { Role } from '@/types/common';
import type { EnrollInCourseInput, LessonRefInput, SaveBlockResponseInput } from '@/types/inputs';
import type { LessonCompletionResult } from '@/types/learning';

const LEARNERS: readonly Role[] = ['student', 'teacher'];

async function notImplemented(): Promise<never> {
  throw new AppError('not_implemented');
}

export async function enrollInCourseAction(
  input: EnrollInCourseInput,
): Promise<ActionResult<{ enrollmentId: string; firstLessonId: string | null }>> {
  return runAction(enrollInCourseInputSchema, input, notImplemented, { roles: LEARNERS });
}

export async function startLessonAction(input: LessonRefInput): Promise<ActionResult<null>> {
  return runAction(lessonRefInputSchema, input, notImplemented, { roles: LEARNERS });
}

export async function saveBlockResponseAction(
  input: SaveBlockResponseInput,
): Promise<ActionResult<null>> {
  return runAction(saveBlockResponseInputSchema, input, notImplemented, { roles: LEARNERS });
}

export async function completeLessonAction(
  input: LessonRefInput,
): Promise<ActionResult<LessonCompletionResult>> {
  return runAction(lessonRefInputSchema, input, notImplemented, { roles: LEARNERS });
}
