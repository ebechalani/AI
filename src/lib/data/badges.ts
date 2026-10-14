import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { assertSystem, type Actor } from '@/lib/auth/actor';
import { getAdminDb } from '@/lib/firebase/admin';
import { collections } from '@/lib/firebase/collections';
import {
  createdNow,
  fromQuery,
  fromSnapshot,
  serverTimestamp,
  updatedNow,
} from '@/lib/firebase/converters';
import type { Badge, UserBadge } from '@/types/gamification';
import type { UserProfile } from '@/types/user';
import { assertCanViewUser, assertId, clampLimit, userDoc } from './internal-identity';

// Badge definitions are reference data: written only by migration scripts in the MVP, and
// readable by every signed-in user.

/** In display order. The collection holds a few dozen documents, so it is read whole. */
export async function listBadges(_actor: Actor, opts?: { activeOnly?: boolean }): Promise<Badge[]> {
  const badges = fromQuery<Badge>(await collections.badges().get());
  return badges
    .filter((badge) => !opts?.activeOnly || badge.isActive)
    .sort((a, b) => a.order - b.order);
}

export async function getBadge(_actor: Actor, badgeId: string): Promise<Badge> {
  assertId(badgeId);
  return fromSnapshot<Badge>(await collections.badges().doc(badgeId).get());
}

/** Newest first. */
export async function listUserBadges(
  actor: Actor,
  uid: string,
  opts?: { limit?: number },
): Promise<UserBadge[]> {
  assertId(uid);
  await assertCanViewUser(actor, uid);
  const ordered = collections.userBadges(uid).orderBy('awardedAt', 'desc');
  const query = opts?.limit === undefined ? ordered : ordered.limit(clampLimit(opts.limit));
  return fromQuery<UserBadge>(await query.get(), { uid });
}

/**
 * Creates the award unless the user already holds the badge, and counts it in
 * `users.stats.badges` in the same transaction. The badge's XP bonus is the caller's business.
 */
export async function createUserBadge(
  actor: Actor,
  uid: string,
  badgeId: string,
  awardedBy: 'system' | string,
  note: string | null,
): Promise<{ created: boolean }> {
  assertSystem(actor);
  assertId(badgeId);
  const userRef = userDoc(uid);
  const awardRef = collections.userBadges(uid).doc(badgeId);

  return getAdminDb().runTransaction(async (tx) => {
    const [user, award] = await tx.getAll(userRef, awardRef);
    fromSnapshot<UserProfile>(user);
    if (award.exists) return { created: false };

    tx.create(awardRef, {
      badgeId,
      awardedAt: serverTimestamp(),
      awardedBy,
      note,
      ...createdNow(),
    });
    tx.update(userRef, { 'stats.badges': FieldValue.increment(1), ...updatedNow() });
    return { created: true };
  });
}
