// The barrel the seed runner reads (ARCHITECTURE.md 11.2, WS-K contract): exactly these two
// names. One course file per demo course; WS-K adds the other four courses here.

import type { SeedChallenge, SeedCourse } from '../types';
import { SEED_CHALLENGES as CHALLENGES } from './challenges';
import { myFirstAiAdventure } from './my-first-ai-adventure';

export const SEED_COURSES: SeedCourse[] = [myFirstAiAdventure];

export const SEED_CHALLENGES: SeedChallenge[] = CHALLENGES;
