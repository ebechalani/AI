import type { Challenge, ChallengePhase } from '@/types/challenge';
import type { IsoDateString } from '@/types/common';

/**
 * Where a challenge stands at `now`: 'upcoming' before `startAt`, 'open' from `startAt` until
 * `deadlineAt`, 'closed' from the deadline on. It looks at the dates only; whether the
 * challenge is published is `status`.
 */
export function getChallengePhase(
  challenge: Pick<Challenge, 'startAt' | 'deadlineAt'>,
  now: Date | IsoDateString,
): ChallengePhase {
  const at = (typeof now === 'string' ? new Date(now) : now).getTime();
  if (at < Date.parse(challenge.startAt)) return 'upcoming';
  return at < Date.parse(challenge.deadlineAt) ? 'open' : 'closed';
}
