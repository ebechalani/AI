'use server';

import { ok } from '@/lib/actions/result';
import { runAction } from '@/lib/actions/run-action';
import { clearSessionCookie } from '@/lib/auth/session';
import { createSessionInputSchema } from '@/lib/schemas/auth';
import { noInputSchema } from '@/lib/schemas/common';
import { endSession, establishSession, issueClientAuthToken } from '@/lib/services/provisioning';
import type { ActionResult } from '@/types/actions';
import { ROLES } from '@/types/common';
import type { CreateSessionInput } from '@/types/inputs';

/**
 * Exchanges the ID token of a fresh sign-in for the session cookie. `redirectTo` is a
 * locale-less path, already checked by safeNextPath.
 */
export async function createSessionAction(
  input: CreateSessionInput,
): Promise<ActionResult<{ redirectTo: string }>> {
  return runAction(
    createSessionInputSchema,
    input,
    (data) => establishSession(data.idToken, data.next ?? null),
    { allowAnonymous: true },
  );
}

/** A custom token for the session's own uid, for ensureClientAuth() before a Storage upload. */
export async function getClientAuthTokenAction(): Promise<ActionResult<{ customToken: string }>> {
  return runAction(noInputSchema, undefined, (_input, session) => issueClientAuthToken(session), {
    roles: ROLES,
  });
}

/**
 * Ends the user's sessions on every device and clears the cookie. Takes no argument and reads
 * none, so it can be used as a form action.
 */
export async function signOutAction(): Promise<ActionResult<null>> {
  const result = await runAction(
    noInputSchema,
    undefined,
    async (_input, session) => {
      await endSession(session);
      return null;
    },
    { roles: ROLES },
  );
  if (!result.ok && result.error.code === 'unauthenticated') {
    // An expired or revoked cookie is no session to end, but it must still go: the proxy
    // takes its mere presence for "signed in". Signing out twice is not a failure.
    await clearSessionCookie();
    return ok(null);
  }
  return result;
}
