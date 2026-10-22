import { ID_PATTERN } from '@/lib/schemas/common';
import type { Role } from '@/types/common';

// Every platform-admin URL, locale-less (as `Link`, `LinkButton` and `router.push` take them).
// Pure, so Vitest can import it; the pages and components never inline these paths.

export const ADMIN_PATHS = {
  dashboard: '/admin',
  schools: '/admin/schools',
  users: '/admin/users',
  subscriptions: '/admin/subscriptions',
  courses: '/admin/courses',
  certificates: '/admin/certificates',
  challenges: '/admin/challenges',
  newChallenge: '/admin/challenges/new',
} as const;

export function adminSchoolPath(schoolId: string): string {
  return `${ADMIN_PATHS.schools}/${schoolId}`;
}

export function adminChallengePath(challengeId: string): string {
  return `${ADMIN_PATHS.challenges}/${challengeId}`;
}

export function adminChallengeEntriesPath(challengeId: string): string {
  return `${adminChallengePath(challengeId)}/entries`;
}

/** The role tab is always explicit, so a link never depends on the default tab. */
export function usersPath(role: Role): string {
  return `${ADMIN_PATHS.users}?role=${role}`;
}

export function userCertificatesPath(uid: string): string {
  return `${ADMIN_PATHS.certificates}?user=${encodeURIComponent(uid)}`;
}

export function userSubscriptionsPath(uid: string): string {
  return `${ADMIN_PATHS.subscriptions}?user=${encodeURIComponent(uid)}`;
}

export type BillingTab = 'subscriptions' | 'licenses';

/** A repeated search parameter counts by its first value. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** `value` when it is a well-formed document id (a uid, a school id); a forged filter is ignored. */
export function idParam(value: string | undefined): string | undefined {
  return value !== undefined && ID_PATTERN.test(value) ? value : undefined;
}
