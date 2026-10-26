// The barrel the seed runner reads (ARCHITECTURE.md 11.2, WS-K contract): exactly these two
// names. One course file per official seed course, seven in all: the five demo courses of
// brief section 22, then the two courses of the 2026-10-longer-courses release (releases.ts),
// whose modules live in scripts/seed/content/<courseId>/ like the modules that release adds to
// the first five. The order matters: the class "Grade 6 A" gets the first two student-audience
// courses of SEED_COURSES (11.6), so new courses go at the end.

import type { SeedChallenge, SeedCourse } from '../types';
import { aiEngineeringWithPython } from './ai-engineering-with-python';
import { aiEssentialsForEducators } from './ai-essentials-for-educators';
import { aiRoboticsFoundations } from './ai-robotics-foundations';
import { buildWithGenerativeAi } from './build-with-generative-ai';
import { SEED_CHALLENGES as CHALLENGES } from './challenges';
import { fromAiUserToAiDeveloper } from './from-ai-user-to-ai-developer';
import { fromIdeaToAiProduct } from './from-idea-to-ai-product';
import { myFirstAiAdventure } from './my-first-ai-adventure';

export const SEED_COURSES: SeedCourse[] = [
  myFirstAiAdventure,
  buildWithGenerativeAi,
  fromAiUserToAiDeveloper,
  aiEssentialsForEducators,
  aiRoboticsFoundations,
  aiEngineeringWithPython,
  fromIdeaToAiProduct,
];

export const SEED_CHALLENGES: SeedChallenge[] = CHALLENGES;
