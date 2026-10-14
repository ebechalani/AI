import type { XpReason } from '@/types/gamification';

/**
 * Default XP per event (ARCHITECTURE.md 9.1). What is actually granted is the reward stored
 * on the lesson, quiz, project, challenge or badge; these are the values a new one starts with.
 */
export const XP_RULES = {
  lesson: 50,
  quiz: 100,
  project: 300,
  challenge: 500,
  badge: 0,
} as const satisfies Partial<Record<XpReason, number>>;

/** Levels stop here; XP keeps counting. */
export const MAX_LEVEL = 50;
