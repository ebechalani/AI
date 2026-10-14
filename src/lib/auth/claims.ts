import 'server-only';
import { loadProfileForSession } from '@/lib/data/users';
import { getAdminAuth } from '@/lib/firebase/admin';

/**
 * Copies `role` and `schoolId` from the profile to the account's custom claims, or clears the
 * claims when there is no profile. The claims are a cache: the server and the Security Rules
 * both read the profile document, so nothing depends on their freshness. This is their only
 * writer.
 */
export async function syncClaims(uid: string): Promise<void> {
  const profile = await loadProfileForSession(uid);
  await getAdminAuth().setCustomUserClaims(
    uid,
    profile === null ? null : { role: profile.role, schoolId: profile.schoolId },
  );
}
