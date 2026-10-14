import type {
  IsoDateString,
  LearningArea,
  Locale,
  Localized,
  MediaRef,
  SubmissionType,
  Timestamped,
} from './common';
import type { HardwareCapability } from './hardware';
import type { RubricWeight } from './project';

export const CHALLENGE_TYPES = ['weekly', 'school', 'roboholic', 'national', 'hackathon'] as const;
export type ChallengeType = (typeof CHALLENGE_TYPES)[number];

export const CHALLENGE_STATUSES = ['draft', 'published', 'archived'] as const;
export type ChallengeStatus = (typeof CHALLENGE_STATUSES)[number];

export const CHALLENGE_SCOPES = ['global', 'school'] as const;
export type ChallengeScope = (typeof CHALLENGE_SCOPES)[number];

/** Derived from `startAt` and `deadlineAt`, never stored. */
export type ChallengePhase = 'upcoming' | 'open' | 'closed';

export interface Challenge extends Timestamped {
  id: string;
  type: ChallengeType;
  scope: ChallengeScope;
  /** Set when `scope` is 'school'. */
  schoolId: string | null;
  status: ChallengeStatus;
  area: LearningArea;
  ageMin: number | null;
  ageMax: number | null;
  startAt: IsoDateString;
  deadlineAt: IsoDateString;
  allowedSubmissionTypes: SubmissionType[];
  rubric: RubricWeight[];
  xpReward: number;
  coverImage: MediaRef | null;
  hardwarePlatformIds: string[];
  requiredCapabilities: HardwareCapability[];
  submissionCount: number;
  createdByUid: string;
  defaultLocale: Locale;
  translations: Localized<{
    title: string;
    description: string;
    submissionRequirements: string;
    prizes: string | null;
  }>;
}
