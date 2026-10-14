import 'server-only';
import { unstable_rethrow } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import type { z } from 'zod';
import { AppError, RateLimitError, ValidationError } from '@/lib/errors';
import { parseInput } from '@/lib/schemas/common';
import type { ActionResult } from '@/types/actions';
import type { Locale, Role } from '@/types/common';
import type { Session } from '@/types/user';
import { fail, ok } from './result';
import { assertSessionNotRevoked, getSession } from './session-source';

export interface ActionContext {
  /** The locale of the page the action was called from; never read from the payload. */
  locale: Locale;
}

function toFailure(error: unknown): ActionResult<never> {
  if (error instanceof RateLimitError) {
    return fail(
      'rate_limited',
      error.retryAfterSeconds === null ? undefined : { retryAfterSeconds: error.retryAfterSeconds },
    );
  }
  if (error instanceof ValidationError) {
    return fail('validation', { fieldErrors: error.fieldErrors });
  }
  if (error instanceof AppError && error.code !== 'internal') return fail(error.code);
  // The message and stack stay in the server log; the client only learns the code.
  console.error('[runAction] unexpected error', error);
  return fail('internal');
}

/**
 * The frame of every server action (ARCHITECTURE.md 1.4): parse the input, resolve the
 * session, check the role, run the handler, and turn any failure into an ActionResult.
 * The role gate is coarse; the services the handler calls authorize the resource.
 */
export function runAction<I, O>(
  schema: z.ZodType<I>,
  input: unknown,
  handler: (data: I, session: Session, ctx: ActionContext) => Promise<O>,
  options: { roles: readonly Role[] },
): Promise<ActionResult<O>>;
/** For the actions that run before a session exists: the handler receives `null`. */
export function runAction<I, O>(
  schema: z.ZodType<I>,
  input: unknown,
  handler: (data: I, session: null, ctx: ActionContext) => Promise<O>,
  options: { allowAnonymous: true },
): Promise<ActionResult<O>>;
export async function runAction<I, O>(
  schema: z.ZodType<I>,
  input: unknown,
  handler: (data: I, session: never, ctx: ActionContext) => Promise<O>,
  options: { roles: readonly Role[] } | { allowAnonymous: true },
): Promise<ActionResult<O>> {
  try {
    const parsed = parseInput(schema, input);
    if (!parsed.success) return fail('validation', { fieldErrors: parsed.fieldErrors });

    let session: Session | null = null;
    if (!('allowAnonymous' in options)) {
      session = await getSession();
      if (session === null) return fail('unauthenticated');
      // getSession() verifies the cookie locally. Staff cookies are also checked against
      // revocation, so a password reset done on the Firebase side ends their mutations at once.
      if (session.role !== 'student') await assertSessionNotRevoked();
      if (!options.roles.includes(session.role)) return fail('forbidden');
    }

    const locale = await getLocale();
    return ok(await handler(parsed.data, session as never, { locale }));
  } catch (error) {
    // redirect() and notFound() work by throwing; those are not failures of the action.
    unstable_rethrow(error);
    return toFailure(error);
  }
}
