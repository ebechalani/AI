'use server';

// Stubs (F8): the signatures and roles of ARCHITECTURE.md 10.4; WS-D fills them in.

import { runAction } from '@/lib/actions/run-action';
import { AppError } from '@/lib/errors';
import { regenerateAiReviewInputSchema, reviewInputSchema } from '@/lib/schemas/submission';
import type { ActionResult } from '@/types/actions';
import type { Role } from '@/types/common';
import type { RegenerateAiReviewInput, ReviewInput } from '@/types/inputs';
import type { SubmissionStatus } from '@/types/project';

const REVIEWERS: readonly Role[] = ['teacher', 'platform_admin'];
const REGENERATORS: readonly Role[] = ['student', 'teacher', 'platform_admin'];

async function notImplemented(): Promise<never> {
  throw new AppError('not_implemented');
}

export async function reviewSubmissionAction(
  input: ReviewInput,
): Promise<ActionResult<{ status: SubmissionStatus }>> {
  return runAction(reviewInputSchema, input, notImplemented, { roles: REVIEWERS });
}

export async function regenerateAiReviewAction(
  input: RegenerateAiReviewInput,
): Promise<ActionResult<null>> {
  return runAction(regenerateAiReviewInputSchema, input, notImplemented, { roles: REGENERATORS });
}
