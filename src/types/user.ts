import type { AgeBand, IsoDateString, Locale, Role, Timestamped } from './common';

export const USER_STATUSES = ['active', 'disabled'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export type ConsentBasis = 'school' | 'self_13_plus' | 'adult';

export interface UserStats {
  lessonsCompleted: number;
  quizzesPassed: number;
  projectsAccepted: number;
  challengesCompleted: number;
  coursesCompleted: number;
  badges: number;
  certificates: number;
}

/** `users/{uid}`. `id` is the Firebase Auth uid. */
export interface UserProfile extends Timestamped {
  id: string;
  role: Role;
  schoolId: string | null;
  displayName: string;
  username: string | null;
  email: string | null;
  ageBand: AgeBand;
  locale: Locale;
  avatarId: string;
  status: UserStatus;
  classIds: string[];
  consentBasis: ConsentBasis;
  provisionedByUid: string | null;
  verifiedEducator: boolean;
  sessionsValidAfter: IsoDateString | null;
  xpTotal: number;
  level: number;
  stats: UserStats;
  lastLoginAt: IsoDateString | null;
}

/** What a teacher receives about a student: no email, consent basis or login time. */
export interface StudentSummary {
  uid: string;
  displayName: string;
  username: string | null;
  ageBand: AgeBand;
  avatarId: string;
  status: UserStatus;
  xpTotal: number;
  level: number;
  canResetPassword: boolean;
}

/**
 * The signed-in user as every request sees it, read from the profile document (never from the
 * cookie's claims). Defined here so shared code can name it; `@/lib/auth/actor` re-exports it.
 */
export interface Session {
  uid: string;
  role: Role;
  schoolId: string | null;
  classIds: string[];
  displayName: string;
  locale: Locale;
  ageBand: AgeBand;
  avatarId: string;
  verifiedEducator: boolean;
}
