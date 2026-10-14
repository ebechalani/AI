import { ForbiddenError } from '@/lib/errors';
import type { Session } from '@/types/user';

export type { Session };

/** Work the server does on its own behalf: gamification, AI review, seed and scripts. */
export interface SystemActor {
  system: true;
  reason: string;
}

/** Who a repository or service call is made for; always its first parameter. */
export type Actor = Session | SystemActor;

/**
 * Passes every authorization check, so it must never be reachable from request-handling code:
 * ESLint bans importing it in src/actions, src/app and src/components.
 */
export const SYSTEM_ACTOR: SystemActor = Object.freeze({ system: true, reason: 'system' });

export function isSystem(actor: Actor): actor is SystemActor {
  return 'system' in actor && actor.system === true;
}

/** First line of every "system only" function. */
export function assertSystem(actor: Actor): asserts actor is SystemActor {
  if (!isSystem(actor)) throw new ForbiddenError('This operation is reserved for the system.');
}
