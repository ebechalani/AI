'use server';

import { runAction } from '@/lib/actions/run-action';
import { submitQuizAttemptInputSchema } from '@/lib/schemas/quiz';
import { submitQuizAttempt } from '@/lib/services/assessment';
import type { ActionResult } from '@/types/actions';
import type { Role } from '@/types/common';
import type { SubmitQuizAttemptInput } from '@/types/inputs';
import type { QuizAttemptResult } from '@/types/quiz';

// ARCHITECTURE.md 10.4: students take quizzes of student courses, teachers those of the
// Teacher Academy; the service checks the enrollment and the course audience.
const LEARNERS: readonly Role[] = ['student', 'teacher'];

/**
 * Grades and records one attempt on the server (ARCHITECTURE.md 10.3) and returns the result as
 * the service built it. The locale of the attempt is the calling page's, never the payload's.
 * No revalidation: the calling runner refreshes the lesson itself.
 */
export async function submitQuizAttemptAction(
  input: SubmitQuizAttemptInput,
): Promise<ActionResult<QuizAttemptResult>> {
  return runAction(
    submitQuizAttemptInputSchema,
    input,
    ({ courseId, quizId, answers }, session, { locale }) =>
      submitQuizAttempt(session, { courseId, quizId, answers, locale }),
    { roles: LEARNERS },
  );
}
