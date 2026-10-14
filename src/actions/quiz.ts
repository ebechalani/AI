'use server';

// Stub (F8): the signature and roles of ARCHITECTURE.md 10.4; WS-C fills it in.

import { runAction } from '@/lib/actions/run-action';
import { AppError } from '@/lib/errors';
import { submitQuizAttemptInputSchema } from '@/lib/schemas/quiz';
import type { ActionResult } from '@/types/actions';
import type { Role } from '@/types/common';
import type { SubmitQuizAttemptInput } from '@/types/inputs';
import type { QuizAttemptResult } from '@/types/quiz';

const LEARNERS: readonly Role[] = ['student', 'teacher'];

async function notImplemented(): Promise<never> {
  throw new AppError('not_implemented');
}

export async function submitQuizAttemptAction(
  input: SubmitQuizAttemptInput,
): Promise<ActionResult<QuizAttemptResult>> {
  return runAction(submitQuizAttemptInputSchema, input, notImplemented, { roles: LEARNERS });
}
