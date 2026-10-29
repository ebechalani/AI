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

/**
 * One module with the quizzes and projects its blocks reference, kept in a file of its own
 * (scripts/seed/content/<courseId>/<moduleId>.ts) and spread into its course's arrays.
 */
export interface SeedModulePart {
  module: SeedModule;
  quizzes: SeedQuiz[];
  projects: SeedProject[];
}

/**
 * Content added to the official courses after a database was first seeded. `npm run
 * content:release` writes it into that database without changing what is already there
 * (ARCHITECTURE.md 11.7); `npm run seed` writes it like the rest. Every id names content of
 * SEED_COURSES.
 */
export interface ContentRelease {
  /** Stable id; what each release created is recorded under it in meta/contentReleases. */
  id: string;
  /** One line for the logs. */
  summary: string;
  /** Courses new in this release, written whole when the database does not hold them. */
  newCourses: string[];
  /**
   * Modules new in this release, in courses the database already holds. Each one is placed
   * after the module that precedes it in the course file, among the modules the database holds.
   */
  newModules: { courseId: string; moduleId: string }[];
  /**
   * Courses whose details (texts, estimated time, tags) change in this release, with
   * fingerprintCourseDetails of the details they replace: details edited in the app are kept.
   */
  courseDetails: { courseId: string; before: string }[];
}
