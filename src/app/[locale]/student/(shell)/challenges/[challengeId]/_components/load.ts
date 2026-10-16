import 'server-only';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { requireRole } from '@/lib/auth/session';
import { getChallenge } from '@/lib/data/challenges';
import { isAppError } from '@/lib/errors';

/**
 * One challenge read per request, shared by `generateMetadata` and the page. A missing,
 * malformed, draft, archived or other-school challenge is one answer: not found (4.4).
 */
export const loadChallenge = cache(async (challengeId: string) => {
  const session = await requireRole('student');
  try {
    return { session, challenge: await getChallenge(session, challengeId) };
  } catch (error) {
    if (isAppError(error) && error.code === 'not_found') notFound();
    throw error;
  }
});
