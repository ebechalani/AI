import type { IsoDateString } from '@/types/common';
import type { Badge, UserBadge, UserStats, XpEntry, XpReason } from '@/types';

// The Achievements page as plain data (ARCHITECTURE.md 3.7 "Achievements", 6.4).

/** The XP history shows this many of the most recent ledger entries. */
export const XP_HISTORY_LIMIT = 20;

export interface EarnedBadge {
  badge: Badge;
  awardedAt: IsoDateString;
}

/**
 * earned: every award whose definition exists (active or not), newest awardedAt first, ties by
 * badge.order; locked: active badges not earned, by order. An award whose badge was deleted is
 * dropped.
 */
export function badgeCollection(
  badges: readonly Badge[],
  awards: readonly UserBadge[],
): { earned: EarnedBadge[]; locked: Badge[] } {
  const byId = new Map(badges.map((badge) => [badge.id, badge]));
  const earned: EarnedBadge[] = [];
  const earnedIds = new Set<string>();
  for (const award of awards) {
    const badge = byId.get(award.badgeId);
    if (badge === undefined || earnedIds.has(badge.id)) continue;
    earnedIds.add(badge.id);
    earned.push({ badge, awardedAt: award.awardedAt });
  }
  earned.sort(
    (a, b) => Date.parse(b.awardedAt) - Date.parse(a.awardedAt) || a.badge.order - b.badge.order,
  );
  const locked = badges
    .filter((badge) => badge.isActive && !earnedIds.has(badge.id))
    .sort((a, b) => a.order - b.order);
  return { earned, locked };
}

export interface XpHistoryRow {
  id: string;
  amount: number;
  reason: XpReason;
  createdAt: IsoDateString;
  /** For a badge bonus, the badge it rewards (null when its definition is unknown). */
  badge: Badge | null;
}

/** Ledger order kept; for reason 'badge' the badge whose id equals refId (null when unknown). */
export function xpHistoryRows(
  entries: readonly XpEntry[],
  badges: readonly Badge[],
): XpHistoryRow[] {
  const byId = new Map(badges.map((badge) => [badge.id, badge]));
  return entries.map((entry) => ({
    id: entry.id,
    amount: entry.amount,
    reason: entry.reason,
    createdAt: entry.createdAt,
    badge: entry.reason === 'badge' ? (byId.get(entry.refId) ?? null) : null,
  }));
}

export type StatKey = keyof Pick<
  UserStats,
  | 'lessonsCompleted'
  | 'quizzesPassed'
  | 'projectsAccepted'
  | 'challengesCompleted'
  | 'coursesCompleted'
  | 'certificates'
>;

/** The progress counters, in display order, each with an ICON_NAMES icon. */
export const STAT_ITEMS: readonly { key: StatKey; icon: string }[] = [
  { key: 'lessonsCompleted', icon: 'BookOpen' },
  { key: 'quizzesPassed', icon: 'ClipboardCheck' },
  { key: 'projectsAccepted', icon: 'FolderKanban' },
  { key: 'challengesCompleted', icon: 'Trophy' },
  { key: 'coursesCompleted', icon: 'GraduationCap' },
  { key: 'certificates', icon: 'Award' },
];

// Complete by construction: a missing or extra reason fails to compile.
const REASONS: Record<XpReason, null> = {
  lesson: null,
  quiz: null,
  project: null,
  challenge: null,
  badge: null,
  adjustment: null,
};
export const XP_REASONS = Object.keys(REASONS) as XpReason[];
