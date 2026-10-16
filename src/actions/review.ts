'use server';

import { runAction } from '@/lib/actions/run-action';
import { regenerateAiReviewInputSchema, reviewInputSchema } from '@/lib/schemas/submission';
import { regenerateAiReview, reviewSubmission } from '@/lib/services/project-flow';
import type { ActionResult } from '@/types/actions';
import type { Role } from '@/types/common';
import type { RegenerateAiReviewInput, ReviewInput } from '@/types/inputs';
import type { SubmissionStatus } from '@/types/project';

// The teacher's decision and new AI suggestions (ARCHITECTURE.md 10.4, 8.4). project-flow
// checks that the actor reviews the submission, and that an `approve` is allowed.

const REVIEWERS: readonly Role[] = ['teacher', 'platform_admin'];
const REGENERATORS: readonly Role[] = ['student', 'teacher', 'platform_admin'];

/** Approve the AI suggestion, grade with the teacher's own scores, or return the work. */
export async function reviewSubmissionAction(
  input: ReviewInput,
): Promise<ActionResult<{ status: SubmissionStatus }>> {
  return runAction(
    reviewInputSchema,
    input,
    async (data, session) => {
      const { submission } = await reviewSubmission(session, data);
      return { status: submission.status };
    },
    { roles: REVIEWERS },
  );
}

/**
 * One more AI suggestion, generated before this returns: by the reviewing teacher, or by the
 * owner of unsupervised work whose review failed or was skipped.
 */
export async function regenerateAiReviewAction(
  input: RegenerateAiReviewInput,
): Promise<ActionResult<null>> {
  return runAction(
    regenerateAiReviewInputSchema,
    input,
    async ({ submissionId }, session) => {
      await regenerateAiReview(session, submissionId);
      return null;
    },
    { roles: REGENERATORS },
  );
}
