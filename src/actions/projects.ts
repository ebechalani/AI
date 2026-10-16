'use server';

import { after } from 'next/server';
import { runAction } from '@/lib/actions/run-action';
import { submitWorkInputSchema } from '@/lib/schemas/submission';
import { generateAiReview, submitWork } from '@/lib/services/project-flow';
import type { ActionResult } from '@/types/actions';
import type { SubmitWorkInput } from '@/types/inputs';

// Sending work (ARCHITECTURE.md 10.4, 9.4): the submission is created first; the AI review runs
// after the response, so the student is not kept waiting. generateAiReview never throws, and a
// review that did not finish is picked up again when the submission is viewed.

/** A project submission or a challenge entry; the locale is the page's, never the payload's. */
export async function submitWorkAction(
  input: SubmitWorkInput,
): Promise<ActionResult<{ submissionId: string }>> {
  return runAction(
    submitWorkInputSchema,
    input,
    async (data, session, { locale }) => {
      const submission = await submitWork(session, { ...data, locale });
      after(() => generateAiReview(submission.id));
      return { submissionId: submission.id };
    },
    { roles: ['student'] },
  );
}
