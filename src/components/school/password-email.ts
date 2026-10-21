import { isAppError } from '@/lib/errors';
import type { ActionError } from '@/types/actions';

/**
 * Sends the "choose your password" email through the Firebase client, loaded on demand so it
 * stays out of the page's first load. Resolves null once sent, or the failure as an
 * `ActionError` (any `AppError` code; anything else counts as `internal`). The email is written
 * in the language of the admin's page (SPEC-G 12.2 Q11).
 */
export async function sendPasswordEmail(email: string): Promise<ActionError | null> {
  try {
    const { sendPasswordReset } = await import('@/lib/auth/client');
    await sendPasswordReset(email);
    return null;
  } catch (error) {
    return { code: isAppError(error) ? error.code : 'internal' };
  }
}
