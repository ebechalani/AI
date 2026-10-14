import type { IsoDateString, Locale, Localized, Timestamped } from './common';
import type { GamificationOutcome } from './gamification';

export const QUESTION_TYPES = [
  'multiple_choice',
  'true_false',
  'multiple_answer',
  'short_answer',
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const REVEAL_ANSWERS = ['after_pass', 'after_attempt', 'never'] as const;
export type RevealAnswers = (typeof REVEAL_ANSWERS)[number];

export interface QuizOption {
  id: string;
  translations: Localized<{ text: string }>;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  points: number;
  translations: Localized<{ prompt: string }>;
  /** true_false: exactly two, with ids 'true' and 'false'. short_answer: none. */
  options: QuizOption[];
}

/** `courses/{courseId}/quizzes/{quizId}`: the student-readable part. It never holds the key. */
export interface Quiz extends Timestamped {
  id: string;
  courseId: string;
  /** The one lesson whose block references this quiz; null while unlinked. */
  lessonId: string | null;
  passingScorePercent: number;
  /** null = unlimited. */
  maxAttempts: number | null;
  xpReward: number;
  shuffleQuestions: boolean;
  revealAnswers: RevealAnswers;
  questionCount: number;
  defaultLocale: Locale;
  translations: Localized<{ title: string; instructions: string | null }>;
  questions: QuizQuestion[];
}

/** `courses/{courseId}/quizzes/{quizId}/private/key`. Server only. */
export interface QuizAnswerKey {
  answers: {
    [questionId: string]: { correctOptionIds: string[]; acceptedAnswers: Localized<string[]> };
  };
  explanations: { [questionId: string]: Localized<{ text: string }> };
}

export interface QuizAnswer {
  selectedOptionIds: string[];
  text: string | null;
}

export interface QuizQuestionResult {
  correct: boolean;
  pointsAwarded: number;
}

export interface QuizAttempt extends Timestamped {
  id: string;
  userUid: string;
  courseId: string;
  quizId: string;
  lessonId: string | null;
  studentName: string;
  quizTitle: Localized<{ title: string }>;
  schoolId: string | null;
  classId: string | null;
  /** 1-based per user, course and quiz. */
  attemptNumber: number;
  locale: Locale;
  answers: Record<string, QuizAnswer>;
  /**
   * Per question. It gives the answer key away, so the student projection carries null
   * until the quiz's reveal rule is met; staff always get it.
   */
  results: Record<string, QuizQuestionResult> | null;
  score: number;
  maxScore: number;
  scorePercent: number;
  passed: boolean;
  xpAwarded: number;
  effectsApplied: boolean;
  submittedAt: IsoDateString;
}

export interface QuizAttemptResult {
  /** Student projection. */
  attempt: QuizAttempt;
  /** Per question; null until the quiz's reveal rule is met. */
  correctOptionIds: Record<string, string[]> | null;
  /** Per question, resolved to the attempt's locale; same reveal rule. */
  explanations: Record<string, string> | null;
  /** null = unlimited. */
  attemptsRemaining: number | null;
  gamification: GamificationOutcome | null;
}
