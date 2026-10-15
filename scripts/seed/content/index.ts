// The barrel the seed runner reads (ARCHITECTURE.md 11.2, WS-K contract): exactly these two
// names. One course file per demo course. The order matters: the class "Grade 6 A" gets the
// first two student-audience courses of SEED_COURSES (11.6).

import type { SeedChallenge, SeedCourse } from '../types';
import { aiEssentialsForEducators } from './ai-essentials-for-educators';
import { aiRoboticsFoundations } from './ai-robotics-foundations';
import { buildWithGenerativeAi } from './build-with-generative-ai';
import { SEED_CHALLENGES as CHALLENGES } from './challenges';
import { fromAiUserToAiDeveloper } from './from-ai-user-to-ai-developer';
import { myFirstAiAdventure } from './my-first-ai-adventure';

export const SEED_COURSES: SeedCourse[] = [
  myFirstAiAdventure,
  buildWithGenerativeAi,
  fromAiUserToAiDeveloper,
  aiEssentialsForEducators,
  aiRoboticsFoundations,
];

export const SEED_CHALLENGES: SeedChallenge[] = CHALLENGES;
