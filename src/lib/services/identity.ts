import 'server-only';
import { SYSTEM_ACTOR } from '@/lib/auth/actor';
import { syncClaims } from '@/lib/auth/claims';
import { adjustSchoolCounts, getSchool } from '@/lib/data/schools';
import { getUser, setIdentity, setSessionsValidAfter } from '@/lib/data/users';
import { getAdminAuth } from '@/lib/firebase/admin';
import type { Role } from '@/types/common';
import type { SchoolCounts } from '@/types/school';
import type { UserProfile, UserStatus } from '@/types/user';

// Internal: no actor and no authorization. Its callers (services/provisioning and
// services/classroom) have authorized; ESLint keeps it out of actions, pages and components.

type Identity = Pick<UserProfile, 'role' | 'schoolId' | 'status'>;

/**
 * The school counter a user is counted in: `counts.students` and `counts.teachers` hold the
 * active students and teachers of the school, so a disabled account, a school admin and a
 * user without a school are in none.
 */
export function countedIn(
  identity: Identity,
): { schoolId: string; counter: keyof Pick<SchoolCounts, 'teachers' | 'students'> } | null {
  if (identity.schoolId === null || identity.status !== 'active') return null;
  if (identity.role === 'student') return { schoolId: identity.schoolId, counter: 'students' };
  if (identity.role === 'teacher') return { schoolId: identity.schoolId, counter: 'teachers' };
  return null;
}

function hasCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

/**
 * Ends every session of the user: cookies from a sign-in before this second stop being
 * accepted (getSession compares auth_time with `sessionsValidAfter`), and Firebase refuses
 * their refresh tokens. The profile is written first; it is what every request checks.
 */
export async function invalidateSessions(uid: string): Promise<void> {
  await setSessionsValidAfter(SYSTEM_ACTOR, uid, new Date());
  try {
    await getAdminAuth().revokeRefreshTokens(uid);
  } catch (error) {
    // A profile whose Auth account is gone has no token left to revoke.
    if (!hasCode(error, 'auth/user-not-found')) throw error;
  }
}

/**
 * The only writer of `users.role`, `users.schoolId` and `users.status`. Fields left out of
 * `change` keep their value. Besides the profile it moves the user between the school
 * counters and refreshes the custom claims.
 *
 * A role change needs the user to be in no class (data/users.setIdentity refuses otherwise);
 * provisioning.changeUserRole empties the classes first.
 */
export async function applyIdentityChange(
  uid: string,
  change: { role?: Role; schoolId?: string | null; status?: UserStatus },
  opts: { invalidateSessions: boolean },
): Promise<void> {
  const before = await getUser(SYSTEM_ACTOR, uid);
  const after: Identity = {
    role: change.role ?? before.role,
    schoolId: change.schoolId === undefined ? before.schoolId : change.schoolId,
    status: change.status ?? before.status,
  };
  if (after.schoolId !== null && after.schoolId !== before.schoolId) {
    // A user is never attached to a school that does not exist.
    await getSchool(SYSTEM_ACTOR, after.schoolId);
  }

  await setIdentity(SYSTEM_ACTOR, uid, after);
  // What protects comes before what only counts: a failure below leaves a counter or the
  // claims behind, never a session that should have ended.
  if (opts.invalidateSessions) await invalidateSessions(uid);

  const left = countedIn(before);
  const joined = countedIn(after);
  if (left?.schoolId !== joined?.schoolId || left?.counter !== joined?.counter) {
    if (left !== null)
      await adjustSchoolCounts(SYSTEM_ACTOR, left.schoolId, { [left.counter]: -1 });
    if (joined !== null) {
      await adjustSchoolCounts(SYSTEM_ACTOR, joined.schoolId, { [joined.counter]: 1 });
    }
  }
  await syncClaims(uid);
}
