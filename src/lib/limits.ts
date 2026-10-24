// Shared constants: safe to import from server and client code. The zod schemas enforce the
// content limits; repositories and services enforce the counters and quotas.

import type { AgeBand } from '@/types/common';

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

// --- AI (ARCHITECTURE.md 8.3, 8.4, 8.7) --------------------------------------------------------

export const AI_LIMITS = {
  /** Tutor messages per UTC day and per minute. A school may override the student's daily value. */
  tutor: {
    student: { perDay: 60, perMinute: 6 },
    teacher: { perDay: 150, perMinute: 10 },
  },
  /** Bounds of `schools.settings.aiDailyMessageLimit`, clamped on write and on read. */
  schoolDailyMessageLimit: { min: 1, max: 200 },
  /** AI Lab requests per UTC day (students only). */
  lab: { perDay: 30 },
  /** Submissions that get an AI review per student per UTC day, and regenerations per submission. */
  review: { perDay: 5, maxRegenerations: 3 },
  /** Input + output tokens per user per UTC day, all kinds together. */
  tokensPerDay: { student: 200_000, teacher: 400_000 },
  /**
   * Visible-length targets in tokens, enforced by the prompt and by checkOutput. They are not
   * the provider's hard cap, which needs headroom for reasoning tokens.
   */
  maxOutputTokens: { tutor: 700, lab: 700, review: 1_500 },
  /** Characters of a submission sent for review; anything longer is cut and flagged. */
  reviewInput: { description: 2_000, text: 8_000, code: 12_000 },
  tutorRequest: {
    maxMessages: 10,
    userMessageChars: 2_000,
    assistantMessageChars: 4_000,
    totalChars: 16_000,
  },
  /** Recent quiz results given to the tutor as context. */
  tutorRecentQuizResults: 3,
  labPromptChars: 2_000,
  /** A review still 'pending' after this long is triggered again when the submission is read. */
  reviewRetriggerAfterMs: 2 * 60 * 1000,
} as const;

/** Tokens per UTC day. The global value can be overridden with AI_DAILY_TOKEN_BUDGET. */
export const AI_BUDGETS = {
  schoolTokensPerDay: 3_000_000,
  globalTokensPerDay: 10_000_000,
} as const;

// --- Uploads and request rates ------------------------------------------------------------------

/** Per user per UTC day. `staff` is every role except student. */
export const UPLOAD_QUOTAS = {
  student: { filesPerDay: 30, bytesPerDay: 300 * MB },
  staff: { filesPerDay: 100, bytesPerDay: 2 * GB },
} as const;

/**
 * Requests per one-hour window. The anonymous scopes are counted per client IP, and a whole
 * school usually shares one address, so they have to let several classes sign up within the
 * same hour. 'join_class' is counted per signed-in user.
 */
export const RATE_LIMITS = {
  join_lookup: 300,
  join_signup: 150,
  join_class: 10,
  signup: 20,
} as const;

export type RateLimitScope = keyof typeof RATE_LIMITS;

// --- Content ------------------------------------------------------------------------------------

export const CONTENT_LIMITS = {
  // Counts
  classesPerUser: 30,
  studentsPerClass: 60,
  teachersPerClass: 5,
  modulesPerCourse: 50,
  lessonsPerModule: 50,
  blocksPerLesson: 40,
  questionsPerQuiz: 50,
  optionsPerQuestion: 8,
  acceptedAnswersPerQuestion: 10,
  outcomesPerCourse: 10,
  tagsPerCourse: 10,
  hardwarePlatformsPerItem: 10,
  courseIdsPerSubscription: 50,
  pathwaysPerLicense: 20,
  /** Languages one document may carry in `translations`. */
  localesPerDocument: 12,
  /** Serialized quiz document plus answer key; saveQuiz rejects anything larger. */
  quizDocumentBytes: 700 * KB,

  // People and organisations (characters)
  displayNameMinChars: 2,
  displayNameMaxChars: 40,
  passwordMinChars: 8,
  passwordMaxChars: 128,
  emailChars: 254,
  classNameChars: 60,
  gradeLabelChars: 40,
  schoolNameMinChars: 2,
  schoolNameMaxChars: 120,
  cityChars: 80,
  licenseNameChars: 120,

  // Translatable text, per locale (characters)
  titleChars: 120,
  summaryChars: 300,
  descriptionChars: 5_000,
  moduleDescriptionChars: 1_000,
  outcomeChars: 200,
  tagChars: 30,
  captionChars: 300,
  richTextBodyChars: 20_000,
  videoTranscriptChars: 30_000,
  fileDescriptionChars: 500,
  blockIntroChars: 1_000,
  activityInstructionsChars: 5_000,
  hintChars: 1_000,
  starterPromptChars: 2_000,
  reflectionPromptChars: 1_000,
  quizInstructionsChars: 1_000,
  questionPromptChars: 1_000,
  optionTextChars: 300,
  explanationChars: 1_000,
  acceptedAnswerChars: 200,
  projectBriefChars: 5_000,
  prizesChars: 1_000,

  // Language-neutral block data
  starterCodeChars: 10_000,
  embedUrlChars: 500,
  /** Bounds the field only; the id formats (YouTube, Vimeo) are shorter. */
  videoIdChars: 20,
  videoDurationSeconds: 24 * 60 * 60,
  /** Width or height of an uploaded image, as measured by the browser. */
  imagePixelsMax: 20_000,
  /** Largest `minLength` an author may ask of a reflection. */
  reflectionMinLengthMax: 2_000,
  /** A learner's saved reflection or code-activity response, per block. */
  blockResponseChars: 10_000,
  /** A learner's short answer; accepted answers are shorter, so more can never match. */
  quizAnswerChars: 500,
  /** `lessons.tutorExcerpt`, per locale. */
  tutorExcerptChars: 2_000,

  // Numbers
  ageMin: 4,
  ageMax: 99,
  courseMinutesMax: 6_000,
  /** Position of an official course inside its pathway. */
  courseOrderMax: 10_000,
  lessonMinutesMax: 600,
  questionPointsMax: 100,
  quizMaxAttemptsMax: 20,
  /** Ceilings for author-set XP, so a self-made course cannot mint levels. */
  xpRewardMax: { lesson: 200, quiz: 500, project: 1_000, challenge: 2_000 },
  seatsMax: 100_000,

  // Staff notes
  feedbackChars: 5_000,
  revokeReasonChars: 500,
  badgeNoteChars: 300,
  notesChars: 1_000,

  // Session requests. These only bound the payload: a Firebase ID token is about 1 KB.
  idTokenChars: 4_096,
  nextPathChars: 2_000,
} as const;

export const SUBMISSION_LIMITS = {
  /** Attempts per student per project or challenge. */
  maxAttempts: 10,
  maxAttachments: 5,
  titleChars: 120,
  descriptionChars: 5_000,
  textChars: 20_000,
  codeChars: 100_000,
  codeLanguageChars: 30,
  linkUrlChars: 2_000,
} as const;

// --- Formats and allow-lists the schemas share with other modules -------------------------------
// The contract places each of these in a module that schemas may not import (auth, firebase,
// learning). They are defined here once, and those modules re-export them.

/** Self sign-up is 13+; a younger account can exist only inside an active school. */
export const SELF_SIGNUP_AGE_BANDS: readonly AgeBand[] = ['13-15', '16-18', 'adult'];

export const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;

/** A UUID generated in the browser before the upload starts. */
export const FILE_ID_PATTERN = /^[0-9a-f-]{36}$/;

export const FILE_NAME_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;

/** No I, L, O, 0 or 1, which children misread. A code is valid for `ttlHours` once enabled. */
export const JOIN_CODE = {
  length: 8,
  alphabet: 'ABCDEFGHJKMNPQRSTUVWXYZ23456789',
  ttlHours: 24,
} as const;

/** Must equal the frame-src list of next.config.ts, or the browser blocks the frame. */
export const EMBED_HOSTS: readonly string[] = ['www.youtube-nocookie.com', 'player.vimeo.com'];

/**
 * Hosts an ml_activity block may link to. They are only ever opened in a new tab, never
 * framed, so they are not EMBED_HOSTS and not in frame-src.
 */
export const ML_ACTIVITY_HOSTS: readonly string[] = ['machinelearningforkids.co.uk'];

/**
 * The folders of the master branch where the official Machine Learning for Kids worksheets and
 * teacher's notes are published (PDF files). The branch is part of each prefix because GitHub
 * serves every ref under the repository's path, pull-request heads and commits of forks
 * included, so a prefix that stopped at the repository would take a PDF anyone could push.
 */
export const ML_WORKSHEET_PREFIXES: readonly string[] = [
  'https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/',
  'https://github.com/IBM/taxinomitis-docs/raw/master/teachers-notes/pdf/',
  'https://raw.githubusercontent.com/IBM/taxinomitis-docs/master/project-worksheets/pdf/',
  'https://raw.githubusercontent.com/IBM/taxinomitis-docs/master/teachers-notes/pdf/',
];

/**
 * What follows one of ML_WORKSHEET_PREFIXES: a single PDF file name, so no further folder, no
 * `..` segment, no `%` escape, no query and no fragment.
 */
export const ML_WORKSHEET_FILE_PATTERN = /^[A-Za-z0-9._-]+\.pdf$/i;
