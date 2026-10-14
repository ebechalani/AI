import { SELF_SIGNUP_AGE_BANDS } from '@/lib/limits';
import type { AgeBand } from '@/types/common';
import type { ConsentBasis } from '@/types/user';

export { SELF_SIGNUP_AGE_BANDS };

export type StudentAccountDecision =
  | { allowed: true; consentBasis: ConsentBasis }
  | {
      allowed: false;
      reason: 'school_inactive' | 'educator_not_verified' | 'under_13_requires_school';
    };

/**
 * Who may create a username account for a child, in a class (ARCHITECTURE.md 1.5): by join
 * code or by a staff member adding students.
 *
 * - A class of an active school: any age band; the school is the consenting party.
 * - A class without a school whose owner is a verified educator: 13 and over only.
 * - Anything else is refused: a self-declared teacher cannot create accounts for children,
 *   and nobody can create an under-13 account outside an active school.
 *
 * `ctx.schoolActive` is read only when the class has a school, `ctx.ownerVerifiedEducator`
 * only when it has none.
 */
export function studentAccountPolicy(
  cls: { schoolId: string | null },
  ctx: { schoolActive: boolean; ownerVerifiedEducator: boolean },
  ageBand: AgeBand,
): StudentAccountDecision {
  if (cls.schoolId !== null) {
    return ctx.schoolActive
      ? { allowed: true, consentBasis: 'school' }
      : { allowed: false, reason: 'school_inactive' };
  }
  if (!ctx.ownerVerifiedEducator) return { allowed: false, reason: 'educator_not_verified' };
  if (!SELF_SIGNUP_AGE_BANDS.includes(ageBand)) {
    return { allowed: false, reason: 'under_13_requires_school' };
  }
  return { allowed: true, consentBasis: ageBand === 'adult' ? 'adult' : 'self_13_plus' };
}
