import type {
  FileRef,
  IsoDateString,
  Locale,
  Localized,
  SubmissionType,
  Timestamped,
} from './common';

export const RUBRIC_KEYS = [
  'creativity',
  'technicalQuality',
  'understanding',
  'responsibleAi',
] as const;
export type RubricKey = (typeof RUBRIC_KEYS)[number];

/** Weights of one rubric sum to 100. */
export interface RubricWeight {
  key: RubricKey;
  weight: number;
}

/** 0–100 per criterion. */
export type CriteriaScores = Record<RubricKey, number>;

export const PROJECT_KINDS = ['project', 'assignment'] as const;
export type ProjectKind = (typeof PROJECT_KINDS)[number];

/** `courses/{courseId}/projects/{projectId}`: the definition students submit work against. */
export interface Project extends Timestamped {
  id: string;
  courseId: string;
  /** The one lesson whose block references this project; null while unlinked. */
  lessonId: string | null;
  kind: ProjectKind;
  allowedSubmissionTypes: SubmissionType[];
  rubric: RubricWeight[];
  xpReward: number;
  requiredForCertificate: boolean;
  defaultLocale: Locale;
  translations: Localized<{ title: string; brief: string; requirements: string }>;
}

export const SUBMISSION_STATUSES = ['submitted', 'ai_reviewed', 'approved', 'returned'] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export type AiReviewStatus = 'pending' | 'ready' | 'failed' | 'skipped';

export type SubmissionTarget =
  | { context: 'project'; courseId: string; projectId: string }
  | { context: 'challenge'; challengeId: string };

export interface SubmissionContent {
  text: string | null;
  linkUrl: string | null;
  code: string | null;
  codeLanguage: string | null;
}

export interface Submission extends Timestamped {
  id: string;
  studentUid: string;
  studentName: string;
  schoolId: string | null;
  /** The reviewing class; null = unsupervised (no teacher). */
  classId: string | null;
  context: 'project' | 'challenge';
  courseId: string | null;
  lessonId: string | null;
  projectId: string | null;
  challengeId: string | null;
  contextTitle: Localized<{ title: string }>;
  attemptNumber: number;
  previousSubmissionId: string | null;
  title: string;
  description: string;
  type: SubmissionType;
  content: SubmissionContent;
  attachments: FileRef[];
  locale: Locale;
  status: SubmissionStatus;
  aiReviewStatus: AiReviewStatus;
  latestAiReviewId: string | null;
  aiRegenerations: number;
  rubric: RubricWeight[];
  finalScore: number | null;
  finalCriteria: CriteriaScores | null;
  finalFeedback: string | null;
  /** null together with status 'returned' = returned by the unsupervised flow. */
  reviewedByUid: string | null;
  reviewedAt: IsoDateString | null;
  xpAwarded: number;
  effectsApplied: boolean;
  submittedAt: IsoDateString;
}

export const REVIEW_DECISIONS = ['approve', 'modify', 'return'] as const;
/** approve = take the AI suggestion as the grade; modify = the teacher's own scores. */
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

/** `submissions/{submissionId}/reviews/{reviewId}`. Append-only. */
export interface TeacherReview {
  id: string;
  submissionId: string;
  reviewerUid: string;
  reviewerName: string;
  decision: ReviewDecision;
  criteria: CriteriaScores | null;
  score: number | null;
  feedback: string;
  /** The AI suggestion the teacher was looking at. */
  aiReviewId: string | null;
  createdAt: IsoDateString;
}

export const AI_REVIEW_FLAGS = [
  'possible_personal_data',
  'unsafe_content',
  'off_topic',
  'possible_plagiarism',
  'possible_prompt_injection',
] as const;
export type AiReviewFlag = (typeof AI_REVIEW_FLAGS)[number];

export const AI_CONFIDENCES = ['low', 'medium', 'high'] as const;
export type AiConfidence = (typeof AI_CONFIDENCES)[number];

/** `submissions/{submissionId}/aiReviews/{aiReviewId}`. A suggestion, never a grade. */
export interface AiReview {
  id: string;
  submissionId: string;
  status: 'ready' | 'failed';
  provider: string;
  model: string;
  promptVersion: string;
  locale: Locale;
  criteria: Record<RubricKey, { score: number; comment: string }> | null;
  overallSuggestedScore: number | null;
  writtenFeedback: string | null;
  strengths: string[];
  improvements: string[];
  confidence: AiConfidence | null;
  limitations: string[];
  flags: AiReviewFlag[];
  error: string | null;
  inputTokens: number;
  outputTokens: number;
  createdAt: IsoDateString;
}
