import { describe, expect, it } from 'vitest';
import {
  badgeCollection,
  STAT_ITEMS,
  XP_REASONS,
  xpHistoryRows,
} from '@/components/achievements/achievements-model';
import { ICON_NAMES } from '@/components/domain/NamedIcon';
import type { UserBadge, XpEntry } from '@/types';
import { badge, NOW } from './services-fixtures';

// The Achievements page's pure model (ARCHITECTURE.md 3.7 "Achievements", 6.4).

function award(badgeId: string, awardedAt: string): UserBadge {
  return {
    id: badgeId,
    uid: 'student-1',
    badgeId,
    awardedAt,
    awardedBy: 'system',
    note: null,
    createdAt: awardedAt,
    updatedAt: awardedAt,
  };
}

function xp(id: string, reason: XpEntry['reason'], refId: string, amount = 50): XpEntry {
  return { id, uid: 'student-1', amount, reason, refId, courseId: null, createdAt: NOW };
}

describe('badgeCollection', () => {
  it('lists earned badges newest first and the active ones still to earn by order', () => {
    const badges = [
      badge({ id: 'b3', order: 3 }),
      badge({ id: 'b1', order: 1 }),
      badge({ id: 'b2', order: 2 }),
      badge({ id: 'retired', order: 4, isActive: false }),
      badge({ id: 'retired-earned', order: 5, isActive: false }),
    ];
    const { earned, locked } = badgeCollection(badges, [
      award('b2', '2026-10-01T00:00:00Z'),
      award('retired-earned', '2026-10-05T00:00:00Z'),
      award('deleted', '2026-10-06T00:00:00Z'),
    ]);
    expect(earned.map((item) => item.badge.id)).toEqual(['retired-earned', 'b2']);
    expect(earned[1].awardedAt).toBe('2026-10-01T00:00:00Z');
    expect(locked.map((item) => item.id)).toEqual(['b1', 'b3']);
  });

  it('breaks a tie on the award date by badge order', () => {
    const { earned } = badgeCollection(
      [badge({ id: 'late', order: 9 }), badge({ id: 'early', order: 1 })],
      [award('late', NOW), award('early', NOW)],
    );
    expect(earned.map((item) => item.badge.id)).toEqual(['early', 'late']);
  });

  it('matches Lea’s seed: 7 badges, 2 awards', () => {
    const badges = [
      'ai-explorer',
      'prompt-master',
      'data-detective',
      'vision-builder',
      'responsible-ai-champion',
      'robotics-engineer',
      'ai-innovator',
    ].map((id, index) => badge({ id, order: index + 1 }));
    const { earned, locked } = badgeCollection(badges, [
      award('responsible-ai-champion', '2026-10-14T10:00:00Z'),
      award('ai-explorer', '2026-10-14T09:00:00Z'),
    ]);
    expect(earned).toHaveLength(2);
    expect(locked).toHaveLength(5);
  });
});

describe('xpHistoryRows', () => {
  it('resolves badge bonuses and keeps the ledger order', () => {
    const rows = xpHistoryRows(
      [
        xp('badge_ai-explorer', 'badge', 'ai-explorer', 100),
        xp('lesson_c_l', 'lesson', 'c_l'),
        xp('badge_gone', 'badge', 'gone', 10),
        xp('quiz_ai-explorer', 'quiz', 'ai-explorer'),
      ],
      [badge({ id: 'ai-explorer' })],
    );
    expect(rows.map((row) => row.id)).toEqual([
      'badge_ai-explorer',
      'lesson_c_l',
      'badge_gone',
      'quiz_ai-explorer',
    ]);
    expect(rows.map((row) => row.badge?.id ?? null)).toEqual(['ai-explorer', null, null, null]);
    expect(rows[0]).toMatchObject({ amount: 100, reason: 'badge', createdAt: NOW });
  });
});

describe('the lists', () => {
  it('orders the stats and names icons NamedIcon can draw', () => {
    expect(STAT_ITEMS.map((item) => item.key)).toEqual([
      'lessonsCompleted',
      'quizzesPassed',
      'projectsAccepted',
      'challengesCompleted',
      'coursesCompleted',
      'certificates',
    ]);
    for (const { icon } of STAT_ITEMS) expect(ICON_NAMES as string[]).toContain(icon);
  });

  it('knows the six XP reasons', () => {
    expect([...XP_REASONS].sort()).toEqual(
      ['adjustment', 'badge', 'challenge', 'lesson', 'project', 'quiz'].sort(),
    );
  });
});
