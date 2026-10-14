import { describe, expect, it } from 'vitest';
import { levelForXp, levelProgress, MAX_LEVEL, xpForLevel } from '@/lib/gamification/levels';
import { XP_RULES } from '@/lib/gamification/rules';

describe('xpForLevel', () => {
  it('follows 100 × level × (level − 1)', () => {
    expect([1, 2, 3, 4, 5, 10].map(xpForLevel)).toEqual([0, 200, 600, 1_200, 2_000, 9_000]);
    expect(xpForLevel(MAX_LEVEL)).toBe(245_000);
  });

  it('treats anything below level 1 as level 1', () => {
    expect([0, -3, Number.NaN].map(xpForLevel)).toEqual([0, 0, 0]);
  });
});

describe('levelForXp', () => {
  it('starts at level 1', () => {
    expect([0, 1, 199].map(levelForXp)).toEqual([1, 1, 1]);
  });

  it('changes level exactly at each threshold, up to the cap', () => {
    for (let level = 2; level <= MAX_LEVEL; level += 1) {
      const threshold = xpForLevel(level);
      expect([threshold - 1, threshold, threshold + 1].map(levelForXp)).toEqual([
        level - 1,
        level,
        level,
      ]);
    }
  });

  it('never goes past MAX_LEVEL', () => {
    expect(MAX_LEVEL).toBe(50);
    expect(
      [xpForLevel(MAX_LEVEL + 1), 10_000_000, 1e300, Number.POSITIVE_INFINITY].map(levelForXp),
    ).toEqual([MAX_LEVEL, MAX_LEVEL, MAX_LEVEL, MAX_LEVEL]);
  });

  it('answers level 1 for a total that is not a positive number', () => {
    expect([-50, Number.NaN, Number.NEGATIVE_INFINITY].map(levelForXp)).toEqual([1, 1, 1]);
  });

  it('takes a new learner to level 3 with one demo course', () => {
    // 4 lessons, 2 quizzes and 1 project at the default rewards.
    const earned = 4 * XP_RULES.lesson + 2 * XP_RULES.quiz + XP_RULES.project;
    expect(earned).toBe(700);
    expect(levelForXp(earned)).toBe(3);
  });
});

describe('levelProgress', () => {
  it('reports the bounds of the current level and the share covered', () => {
    expect(levelProgress(0)).toEqual({
      level: 1,
      currentLevelXp: 0,
      nextLevelXp: 200,
      percent: 0,
    });
    expect(levelProgress(700)).toEqual({
      level: 3,
      currentLevelXp: 600,
      nextLevelXp: 1_200,
      percent: 16,
    });
  });

  it('rounds the percentage down, so 100 is never shown before the level changes', () => {
    expect(levelProgress(199).percent).toBe(99);
    expect(levelProgress(200)).toMatchObject({ level: 2, percent: 0 });
  });

  it('is complete at the cap', () => {
    const top = xpForLevel(MAX_LEVEL);
    for (const xp of [top, top + 12_345]) {
      expect(levelProgress(xp)).toEqual({
        level: MAX_LEVEL,
        currentLevelXp: top,
        nextLevelXp: top,
        percent: 100,
      });
    }
  });

  it('treats a negative or invalid total as zero', () => {
    for (const xp of [-10, Number.NaN]) {
      expect(levelProgress(xp)).toEqual({
        level: 1,
        currentLevelXp: 0,
        nextLevelXp: 200,
        percent: 0,
      });
    }
  });
});

describe('XP_RULES', () => {
  it('holds the default rewards of ARCHITECTURE.md 9.1', () => {
    expect(XP_RULES).toEqual({ lesson: 50, quiz: 100, project: 300, challenge: 500, badge: 0 });
  });
});
