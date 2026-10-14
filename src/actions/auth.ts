'use server';

import { runAction } from '@/lib/actions/run-action';
import { getClientKey } from '@/lib/request-meta';
import {
  completeSignupInputSchema,
  joinSignupInputSchema,
  lookupJoinCodeInputSchema,
} from '@/lib/schemas/auth';
import { lookupJoinCode } from '@/lib/services/classroom';
import { completeSignup, signUpWithJoinCode } from '@/lib/services/provisioning';
import type { ActionResult } from '@/types/actions';
import type { CompleteSignupInput, JoinSignupInput, LookupJoinCodeInput } from '@/types/inputs';

// The three anonymous entry points of account creation (ARCHITECTURE.md 1.5, paths 1 and 2).
// Each is counted per client address by the service's rate limit, hence getClientKey().

/**
 * Writes the profile of a self sign-up once the browser has created the Auth user. No session
 * is created: the user confirms the email address first, then logs in.
 */
export async function completeSignupAction(
  input: CompleteSignupInput,
): Promise<ActionResult<{ redirectTo: string }>> {
  return runAction(
    completeSignupInputSchema,
    input,
    async (data) => {
      await completeSignup(data.idToken, data, { clientKey: await getClientKey() });
      return { redirectTo: '/verify-email' };
    },
    { allowAnonymous: true },
  );
}

/** What a class code opens: the class name and whether an account can be created in it. */
export async function lookupJoinCodeAction(
  input: LookupJoinCodeInput,
): Promise<ActionResult<{ className: string; accountCreation: boolean; under13Allowed: boolean }>> {
  return runAction(
    lookupJoinCodeInputSchema,
    input,
    async (data) => lookupJoinCode(data.joinCode, { clientKey: await getClientKey() }),
    { allowAnonymous: true },
  );
}

/** Creates a username account inside the class of the code and adds it to the roster. */
export async function joinClassSignupAction(
  input: JoinSignupInput,
): Promise<ActionResult<{ username: string }>> {
  return runAction(
    joinSignupInputSchema,
    input,
    async (data) => signUpWithJoinCode(data, { clientKey: await getClientKey() }),
    { allowAnonymous: true },
  );
}
