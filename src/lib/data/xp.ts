import 'server-only';
import { assertSystem, type Actor } from '@/lib/auth/actor';
import { getAdminDb } from '@/lib/firebase/admin';
import { collections, docIds } from '@/lib/firebase/collections';
import { fromQuery, fromSnapshot, serverTimestamp, updatedNow } from '@/lib/firebase/converters';
import { levelForXp } from '@/lib/gamification/levels';
import { COMPOSITE_ID_PATTERN } from '@/lib/schemas/common';
import type { XpEntry, XpReason } from '@/types/gamification';
import type { UserProfile, UserStats } from '@/types/user';
import { assertCanViewUser, assertId, clampLimit, userDoc } from './internal-identity';

/** The counter each kind of award moves. A badge bonus and an adjustment move none. */
const STAT_OF_REASON: Record<XpReason, keyof UserStats | null> = {
  lesson: 'lessonsCompleted',
  quiz: 'quizzesPassed',
  project: 'projectsAccepted',
  challenge: 'challengesCompleted',
  badge: null,
  adjustment: null,
};

/** Newest first. */
export async function listXpEntries(actor: Actor, uid: string, limit: number): Promise<XpEntry[]> {
  assertId(uid);
  await assertCanViewUser(actor, uid);
  const snapshot = await collections
    .userXpLedger(uid)
    .orderBy('createdAt', 'desc')
    .limit(clampLimit(limit))
    .get();
  return fromQuery<XpEntry>(snapshot, { uid });
}

/**
 * One transaction: the ledger entry `${reason}_${refId}` is created unless it exists, and only
 * then do the total, the level and the matching counter move. Running it again for the same
 * entry changes nothing and answers `created: false` with the current values, `stat` included,
 * so a handler that died after the award can still evaluate its badges.
 */
export async function applyXpEntry(
  actor: Actor,
  uid: string,
  entry: { reason: XpReason; refId: string; amount: number; courseId: string | null },
): Promise<{
  created: boolean;
  xpTotal: number;
  level: number;
  previousLevel: number;
  stat: { name: string; value: number } | null;
}> {
  assertSystem(actor);
  if (!Object.hasOwn(STAT_OF_REASON, entry.reason)) throw new Error('Unknown XP reason.');
  if (!Number.isInteger(entry.amount)) throw new Error('An XP amount is a whole number.');
  const entryId = docIds.xpEntry(entry.reason, entry.refId);
  assertId(entryId, COMPOSITE_ID_PATTERN);
  const userRef = userDoc(uid);
  const entryRef = collections.userXpLedger(uid).doc(entryId);
  const statName = STAT_OF_REASON[entry.reason];

  return getAdminDb().runTransaction(async (tx) => {
    const [user, existing] = await tx.getAll(userRef, entryRef);
    const profile = fromSnapshot<UserProfile>(user);
    const statValue = statName === null ? 0 : (profile.stats[statName] ?? 0);
    if (existing.exists) {
      return {
        created: false,
        xpTotal: profile.xpTotal,
        level: profile.level,
        previousLevel: profile.level,
        stat: statName === null ? null : { name: statName, value: statValue },
      };
    }

    const xpTotal = Math.max(0, profile.xpTotal + entry.amount);
    const level = levelForXp(xpTotal);
    tx.create(entryRef, {
      amount: entry.amount,
      reason: entry.reason,
      refId: entry.refId,
      courseId: entry.courseId,
      createdAt: serverTimestamp(),
    });
    tx.update(userRef, {
      xpTotal,
      level,
      ...(statName === null ? {} : { [`stats.${statName}`]: statValue + 1 }),
      ...updatedNow(),
    });
    return {
      created: true,
      xpTotal,
      level,
      previousLevel: profile.level,
      stat: statName === null ? null : { name: statName, value: statValue + 1 },
    };
  });
}
