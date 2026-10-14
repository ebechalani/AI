import { MAX_LEVEL } from './rules';

export { MAX_LEVEL };

/** Total XP needed to reach `level`: 100 × level × (level − 1). Level 1 is 0 XP, level 2 is 200. */
export function xpForLevel(level: number): number {
  const whole = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
  return 100 * whole * (whole - 1);
}

/** The level a total of `xp` gives, from 1 to MAX_LEVEL. */
export function levelForXp(xp: number): number {
  if (!(xp > 0)) return 1;
  if (xp >= xpForLevel(MAX_LEVEL)) return MAX_LEVEL;
  let level = Math.floor((1 + Math.sqrt(1 + xp / 25)) / 2);
  // The formula is the exact inverse of xpForLevel; the loops absorb a rounding error of the
  // square root right at a threshold.
  while (xpForLevel(level + 1) <= xp) level += 1;
  while (level > 1 && xpForLevel(level) > xp) level -= 1;
  return level;
}

/**
 * Where `xp` stands inside its level. `currentLevelXp` and `nextLevelXp` are the totals at
 * which the current and the next level start; `percent` (0–100, rounded down) is the part of
 * that stretch already covered. At MAX_LEVEL there is no next level: `nextLevelXp` equals
 * `currentLevelXp` and `percent` is 100.
 */
export function levelProgress(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  percent: number;
} {
  const level = levelForXp(xp);
  const currentLevelXp = xpForLevel(level);
  if (level >= MAX_LEVEL) {
    return { level, currentLevelXp, nextLevelXp: currentLevelXp, percent: 100 };
  }
  const nextLevelXp = xpForLevel(level + 1);
  const covered = xp > currentLevelXp ? xp - currentLevelXp : 0;
  const percent = Math.floor((covered * 100) / (nextLevelXp - currentLevelXp));
  return { level, currentLevelXp, nextLevelXp, percent };
}
