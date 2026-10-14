import type { IsoDateString, Timestamped } from './common';
import type { Course, Lesson, LessonBlock, Module } from './content';
import type { GamificationOutcome } from './gamification';
import type { Project, Submission, SubmissionStatus } from './project';
import type { Quiz, QuizAttempt } from './quiz';

export interface QuizSummaryEntry {
  attempts: number;
  passed: boolean;
  bestPercent: number;
  lastPercent: number;
}

export interface ProjectSummaryEntry {
  attempts: number;
  latestSubmissionId: string;
  latestStatus: SubmissionStatus;
}

/** `enrollments/{uid}_{courseId}`. */
export interface Enrollment extends Timestamped {
  id: string;
  userUid: string;
  courseId: string;
  schoolId: string | null;
  /** The supervising class; null = unsupervised. */
  classId: string | null;
  source: 'self' | 'class';
  /** One-way: never goes back from 'completed' to 'active'. */
  status: 'active' | 'completed';
  completedLessonIds: string[];
  completedLessonCount: number;
  totalLessonCount: number;
  /** 0–100 integer. */
  progressPercent: number;
  lastLessonId: string | null;
  lastActivityAt: IsoDateString;
  startedAt: IsoDateString;
  completedAt: IsoDateString | null;
  certificateId: string | null;
  quizSummary: Record<string, QuizSummaryEntry>;
  projectSummary: Record<string, ProjectSummaryEntry>;
}

export interface BlockResponse {
  text: string;
  updatedAt: IsoDateString;
}

/** `enrollments/{enrollmentId}/lessonProgress/{lessonId}`. `id` is the lesson id. */
export interface LessonProgress extends Timestamped {
  id: string;
  userUid: string;
  courseId: string;
  status: 'in_progress' | 'completed';
  /** Keyed by block id: reflection and code_activity blocks. */
  responses: Record<string, BlockResponse>;
  xpAwarded: number;
  effectsApplied: boolean;
  startedAt: IsoDateString;
  completedAt: IsoDateString | null;
}

/** Everything the lesson player renders, in one server call. Quiz and project maps are keyed by id. */
export interface LessonPlayerData {
  course: Course;
  modules: Module[];
  lessons: Lesson[];
  lesson: Lesson;
  blocks: LessonBlock[];
  enrollment: Enrollment | null;
  progress: LessonProgress | null;
  quizzes: Record<string, Quiz>;
  /** Student projection. */
  latestAttempts: Record<string, QuizAttempt | null>;
  attemptsRemaining: Record<string, number | null>;
  projects: Record<string, Project>;
  latestSubmissions: Record<string, Submission | null>;
  previousLessonId: string | null;
  nextLessonId: string | null;
  /** Decided by the server: no enrollment is created, nothing is saved. */
  readOnly: boolean;
  tutorEnabled: boolean;
}

export interface LessonCompletionResult {
  completed: boolean;
  /** What still blocks completion; all three are empty when `completed` is true. */
  missing: { quizIds: string[]; projectIds: string[]; reflectionBlockIds: string[] };
  enrollment: Enrollment;
  gamification: GamificationOutcome | null;
}
