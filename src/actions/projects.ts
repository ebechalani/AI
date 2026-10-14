'use server';

// Stub (F8): the signature and roles of ARCHITECTURE.md 10.4; WS-D fills it in.

import { runAction } from '@/lib/actions/run-action';
import { AppError } from '@/lib/errors';
import { submitWorkInputSchema } from '@/lib/schemas/submission';
import type { ActionResult } from '@/types/actions';
import type { SubmitWorkInput } from '@/types/inputs';

async function notImplemented(): Promise<never> {
  throw new AppError('not_implemented');
}

export async function submitWorkAction(
  input: SubmitWorkInput,
): Promise<ActionResult<{ submissionId: string }>> {
  return runAction(submitWorkInputSchema, input, notImplemented, { roles: ['student'] });
}
