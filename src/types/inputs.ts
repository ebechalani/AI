// What forms and editors send to server actions. Each type `X` has a zod schema named
// `<camelCase X>Schema` in src/lib/schemas, and nothing here is trusted before that schema
// has parsed it. No type carries what the server derives: who is acting, a storage path,
// XP earned, a quiz result, a final score, or the locale the action runs in.

import type { LabToolId } from './ai';
import type { ChallengeScope, ChallengeStatus, ChallengeType } from './challenge';
import type {
  AgeBand,
  Audience,
  FileKind,
  IsoDateString,
  LearningArea,
  Locale,
  Localized,
  Role,
  SubmissionType,
} from './common';
import type {
  AccessTier,
  BlockDataMap,
  BlockTextMap,
  BlockType,
  CourseStatus,
  LessonStage,
  VideoSource,
} from './content';
import type { HardwareCapability } from './hardware';
import type {
  LicenseScope,
  LicenseStatus,
  SubscriptionOwnerType,
  SubscriptionPlan,
  SubscriptionStatus,
} from './billing';
import type {
  CriteriaScores,
  ProjectKind,
  ReviewDecision,
  RubricWeight,
  SubmissionContent,
  SubmissionTarget,
} from './project';
import type { QuestionType, QuizAnswer, RevealAnswers } from './quiz';
import type { SchoolSettings, SchoolStatus } from './school';
import type { UserStatus } from './user';

// --- Session and sign-up -----------------------------------------------------------------------

export interface CreateSessionInput {
  idToken: string;
  /** Locale-less path to return to; judged by safeNextPath, never trusted. */
  next?: string | null;
}

/** role 'student' needs an age band of SELF_SIGNUP_AGE_BANDS; role 'teacher' needs 'adult'. */
export interface SignupInput {
  displayName: string;
  role: 'student' | 'teacher';
  ageBand: AgeBand;
  locale: Locale;
  acceptedTerms: true;
}

export type CompleteSignupInput = { idToken: string } & SignupInput;

export interface LookupJoinCodeInput {
  joinCode: string;
}

export interface JoinSignupInput {
  joinCode: string;
  displayName: string;
  username: string;
  password: string;
  ageBand: AgeBand;
  locale: Locale;
  acceptedTerms: true;
}

export interface ProfilePatch {
  displayName?: string;
  locale?: Locale;
  avatarId?: string;
}

// --- Learning ----------------------------------------------------------------------------------

export interface EnrollInCourseInput {
  courseId: string;
}

export interface LessonRefInput {
  courseId: string;
  lessonId: string;
}

export interface SaveBlockResponseInput {
  courseId: string;
  lessonId: string;
  blockId: string;
  text: string;
}

export interface SubmitQuizAttemptInput {
  courseId: string;
  quizId: string;
  /** Keyed by question id. */
  answers: Record<string, QuizAnswer>;
}

// --- Files, submissions, review ----------------------------------------------------------------

/** Sent after the browser upload has finished. The storage path is built on the server. */
export type RegisterUploadInput = {
  fileId: string;
  kind: FileKind;
  fileName: string;
  width?: number | null;
  height?: number | null;
} & (
  | { purpose: 'submission' }
  /** courseId null = official media without a course (platform admin only). */
  | { purpose: 'course_media'; courseId: string | null }
);

export interface DeleteAttachmentInput {
  submissionId: string;
  fileId: string;
}

export interface SubmitWorkInput {
  target: SubmissionTarget;
  title: string;
  description: string;
  type: SubmissionType;
  content: SubmissionContent;
  /** Registered, unattached submission files of the caller. */
  fileIds: string[];
  previousSubmissionId: string | null;
}

export interface ReviewInput {
  submissionId: string;
  decision: ReviewDecision;
  /** The teacher's own scores: required for 'modify', null otherwise. */
  criteria: CriteriaScores | null;
  feedback: string;
  /**
   * The AI suggestion shown to the teacher when they decided; null when none was shown. When
   * given, an 'approve' is accepted only if it names the submission's latest AI review, so the
   * grade is the one the teacher saw (ARCHITECTURE.md 8.4). Omitted: the latest is used.
   */
  aiReviewId?: string | null;
}

export interface RegenerateAiReviewInput {
  submissionId: string;
}

// --- Classes -----------------------------------------------------------------------------------

export interface ClassInput {
  name: string;
  gradeLabel: string | null;
  ageBand: AgeBand;
  /** Required for a school admin (an active teacher of their school); ignored for a teacher. */
  ownerUid?: string;
}

export interface ClassRefInput {
  classId: string;
}

export interface UpdateClassInput {
  classId: string;
  name?: string;
  gradeLabel?: string | null;
  ageBand?: AgeBand;
  joinCodeEnabled?: boolean;
}

export interface NewStudentInput {
  displayName: string;
  /** Defaults to the class's age band. */
  ageBand?: AgeBand;
}

export interface AddStudentsInput {
  classId: string;
  students: NewStudentInput[];
}

export interface RemoveStudentInput {
  classId: string;
  studentUid: string;
}

export interface ResetStudentPasswordInput {
  studentUid: string;
}

export interface AssignCourseInput {
  classId: string;
  courseId: string;
  dueAt: IsoDateString | null;
}

export interface UnassignCourseInput {
  classId: string;
  courseId: string;
}

export interface JoinClassInput {
  joinCode: string;
}

export interface AwardBadgeInput {
  studentUid: string;
  badgeId: string;
  note: string | null;
}

// --- Course editor -----------------------------------------------------------------------------

export interface CourseInput {
  defaultLocale: Locale;
  translations: Localized<{
    title: string;
    summary: string;
    description: string;
    outcomes: string[];
  }>;
  audience: Audience;
  area: LearningArea;
  tags: string[];
  ageMin: number | null;
  ageMax: number | null;
  estimatedMinutes: number;
  /** Teacher-made courses; official courses are always 'public'. */
  visibility: 'private' | 'school';
  certificateEnabled: boolean;
  /** A registered course_media file of this course; null on create (upload needs the id). */
  coverImageFileId: string | null;
  hardwarePlatformIds: string[];
  requiredCapabilities: HardwareCapability[];
  // Platform admin only. For anyone else these are stripped, and the repository forces
  // isOfficial false, pathwayId null and accessTier 'free'.
  isOfficial?: boolean;
  pathwayId?: string | null;
  order?: number;
  accessTier?: AccessTier;
}

export interface UpdateCourseInput {
  courseId: string;
  /** `translations` and `defaultLocale` travel together. */
  patch: Partial<CourseInput>;
}

export interface SetCourseStatusInput {
  courseId: string;
  status: CourseStatus;
}

export interface ModuleInput {
  defaultLocale: Locale;
  translations: Localized<{ title: string; description: string }>;
}

export interface CreateModuleInput {
  courseId: string;
  input: ModuleInput;
}

export interface UpdateModuleInput {
  courseId: string;
  moduleId: string;
  patch: Partial<ModuleInput>;
}

export interface ModuleRefInput {
  courseId: string;
  moduleId: string;
}

export interface ReorderModulesInput {
  courseId: string;
  orderedIds: string[];
}

export interface LessonInput {
  defaultLocale: Locale;
  translations: Localized<{ title: string; summary: string }>;
  estimatedMinutes: number;
  xpReward: number;
}

export interface CreateLessonInput {
  courseId: string;
  moduleId: string;
  input: LessonInput;
}

export interface UpdateLessonInput {
  courseId: string;
  lessonId: string;
  patch: Partial<LessonInput>;
}

export interface ReorderLessonsInput {
  courseId: string;
  moduleId: string;
  orderedIds: string[];
}

/**
 * `data` as an editor sends it: BlockDataMap, except that a block carrying media names a
 * registered course_media file by id and the server builds the MediaRef.
 */
export interface BlockInputDataMap {
  rich_text: BlockDataMap['rich_text'];
  image: { fileId: string };
  video: {
    source: VideoSource;
    videoId: string | null;
    fileId: string | null;
    durationSeconds: number | null;
  };
  file: { fileId: string };
  quiz: BlockDataMap['quiz'];
  code_activity: BlockDataMap['code_activity'];
  ai_activity: BlockDataMap['ai_activity'];
  embed: BlockDataMap['embed'];
  reflection: BlockDataMap['reflection'];
  project: BlockDataMap['project'];
  ml_activity: BlockDataMap['ml_activity'];
}

export type BlockInputOf<T extends BlockType> = {
  type: T;
  stage: LessonStage;
  defaultLocale: Locale;
  translations: Localized<BlockTextMap[T]>;
  data: BlockInputDataMap[T];
};

export type BlockInput = { [T in BlockType]: BlockInputOf<T> }[BlockType];

export interface CreateBlockInput {
  courseId: string;
  lessonId: string;
  input: BlockInput;
}

/** Replaces the whole block. */
export interface UpdateBlockInput {
  courseId: string;
  lessonId: string;
  blockId: string;
  input: BlockInput;
}

export interface BlockRefInput {
  courseId: string;
  lessonId: string;
  blockId: string;
}

export interface ReorderBlocksInput {
  courseId: string;
  lessonId: string;
  orderedIds: string[];
}

export interface QuizOptionInput {
  /** null = new option; the server assigns ids. */
  id: string | null;
  translations: Localized<{ text: string }>;
}

export interface QuizQuestionInput {
  /** null = new question; the server assigns ids. */
  id: string | null;
  type: QuestionType;
  points: number;
  translations: Localized<{ prompt: string }>;
  /** [] for short_answer; true_false: exactly two, with ids 'true' and 'false'. */
  options: QuizOptionInput[];
  /** Indexes into `options` (new options have no id yet); [] for short_answer. */
  correctOptionIndexes: number[];
  /** short_answer only; {} otherwise. */
  acceptedAnswers: Localized<string[]>;
  /** May be {}. */
  explanation: Localized<{ text: string }>;
}

/** Carries the answer key: only ever sent by an author, to saveQuizAction. */
export interface QuizInput {
  defaultLocale: Locale;
  translations: Localized<{ title: string; instructions: string | null }>;
  passingScorePercent: number;
  maxAttempts: number | null;
  xpReward: number;
  shuffleQuestions: boolean;
  revealAnswers: RevealAnswers;
  questions: QuizQuestionInput[];
}

export interface SaveQuizInput {
  courseId: string;
  /** null = create. */
  quizId: string | null;
  input: QuizInput;
}

export interface QuizRefInput {
  courseId: string;
  quizId: string;
}

export interface ProjectInput {
  kind: ProjectKind;
  defaultLocale: Locale;
  translations: Localized<{ title: string; brief: string; requirements: string }>;
  allowedSubmissionTypes: SubmissionType[];
  /** Weights sum to 100. */
  rubric: RubricWeight[];
  xpReward: number;
  requiredForCertificate: boolean;
}

export interface SaveProjectInput {
  courseId: string;
  /** null = create. */
  projectId: string | null;
  input: ProjectInput;
}

export interface ProjectRefInput {
  courseId: string;
  projectId: string;
}

// --- Certificates ------------------------------------------------------------------------------

export interface IssueCertificateInput {
  studentUid: string;
  courseId: string;
}

export interface RevokeCertificateInput {
  certificateId: string;
  reason: string;
}

// --- School admin ------------------------------------------------------------------------------

export interface SchoolInput {
  name: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  city: string | null;
  defaultLocale: Locale;
}

export interface SchoolPatch {
  name?: string;
  country?: string;
  city?: string | null;
  defaultLocale?: Locale;
  settings?: SchoolSettings;
}

export interface CreateTeacherInput {
  displayName: string;
  email: string;
}

export interface SetUserStatusInput {
  uid: string;
  status: UserStatus;
}

export type UpdateSchoolSettingsInput = Omit<SchoolPatch, 'country'>;

export interface SetClassTeachersInput {
  classId: string;
  teacherUids: string[];
}

// --- Platform admin ----------------------------------------------------------------------------

export interface CreateSchoolInput {
  school: SchoolInput;
  adminDisplayName: string;
  adminEmail: string;
}

export interface UpdateSchoolInput {
  schoolId: string;
  patch: SchoolPatch;
}

export interface SetSchoolStatusInput {
  schoolId: string;
  status: SchoolStatus;
}

/** school_admin needs a school; platform_admin has none. */
export interface SetUserRoleInput {
  uid: string;
  role: Role;
  schoolId: string | null;
}

export interface SetVerifiedEducatorInput {
  uid: string;
  verified: boolean;
}

export interface SubscriptionInput {
  ownerType: SubscriptionOwnerType;
  ownerId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: IsoDateString;
  currentPeriodEnd: IsoDateString;
  /** At least one for course_purchase and teacher_training; [] otherwise. */
  courseIds: string[];
  notes: string | null;
}

export interface UpsertSubscriptionInput {
  /** null = create. */
  subscriptionId: string | null;
  input: SubscriptionInput;
}

export interface LicenseInput {
  schoolId: string;
  subscriptionId: string | null;
  name: string;
  seatsTotal: number;
  scope: LicenseScope;
  startsAt: IsoDateString;
  endsAt: IsoDateString;
  status: LicenseStatus;
}

export interface UpsertLicenseInput {
  /** null = create. */
  licenseId: string | null;
  input: LicenseInput;
}

export interface ChallengeInput {
  type: ChallengeType;
  scope: ChallengeScope;
  /** Required when `scope` is 'school'; null otherwise. */
  schoolId: string | null;
  area: LearningArea;
  ageMin: number | null;
  ageMax: number | null;
  startAt: IsoDateString;
  deadlineAt: IsoDateString;
  allowedSubmissionTypes: SubmissionType[];
  /** Weights sum to 100. */
  rubric: RubricWeight[];
  xpReward: number;
  /** A registered official course_media file (registered with courseId null). */
  coverImageFileId: string | null;
  hardwarePlatformIds: string[];
  requiredCapabilities: HardwareCapability[];
  defaultLocale: Locale;
  translations: Localized<{
    title: string;
    description: string;
    submissionRequirements: string;
    prizes: string | null;
  }>;
}

export interface UpsertChallengeInput {
  /** null = create. */
  challengeId: string | null;
  input: ChallengeInput;
}

export interface SetChallengeStatusInput {
  challengeId: string;
  status: ChallengeStatus;
}

// --- AI ----------------------------------------------------------------------------------------

export interface RunLabToolInput {
  toolId: LabToolId;
  prompt: string;
}
