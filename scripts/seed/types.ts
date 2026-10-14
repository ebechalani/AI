// The shape of seed content (ARCHITECTURE.md 11.2, WS-K contract). Ids are stable, match
// ID_PATTERN and are unique within the course; the position of an item in its array is its
// `order`. The runner (scripts/seed/index.ts) writes the documents with these ids and derives
// every denormalized field itself.

import type {
  BlockInput,
  ChallengeInput,
  CourseInput,
  LessonInput,
  ModuleInput,
  ProjectInput,
  QuizInput,
} from '@/types/inputs';

export interface SeedCourse {
  /** The course slug, used as the document id (section 11.6). */
  id: string;
  /**
   * An official, free course of a pathway. `visibility` is part of CourseInput but has no
   * effect: an official course is always public.
   */
  course: Omit<CourseInput, 'coverImageFileId'> & {
    isOfficial: true;
    pathwayId: string;
    order: number;
    accessTier: 'free';
  };
  modules: SeedModule[];
  /** Referenced from quiz blocks by id. */
  quizzes: SeedQuiz[];
  /** Referenced from project blocks by id. */
  projects: SeedProject[];
}

export interface SeedModule {
  id: string;
  input: ModuleInput;
  lessons: SeedLesson[];
}

export interface SeedLesson {
  id: string;
  input: LessonInput;
  blocks: SeedBlock[];
}

export type SeedBlock = { id: string } & BlockInput;

/** Includes the answer key: the runner splits it into the quiz document and private/key. */
export interface SeedQuiz {
  id: string;
  input: QuizInput;
}

export interface SeedProject {
  id: string;
  input: ProjectInput;
}

export interface SeedChallenge {
  id: string;
  input: ChallengeInput;
}
