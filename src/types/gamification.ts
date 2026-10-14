import type { IsoDateString, Locale, Localized, Timestamped } from './common';

export type XpReason = 'lesson' | 'quiz' | 'project' | 'challenge' | 'badge' | 'adjustment';

export type BadgeCriteria =
  | {
      type: 'stat_threshold';
      stat:
        | 'lessonsCompleted'
        | 'quizzesPassed'
        | 'projectsAccepted'
        | 'challengesCompleted'
        | 'coursesCompleted';
      threshold: number;
    }
  | { type: 'course_completed'; courseId: string }
  /** Every published official course of the pathway has a completed enrollment. */
  | { type: 'pathway_completed'; pathwayId: string }
  /** Awarded by a teacher to their students, or by a platform admin. */
  | { type: 'manual' };

/** What just happened, so badge evaluation only looks at criteria the event can affect. */
export type BadgeTrigger =
  | {
      type: 'stat';
      stat: 'lessonsCompleted' | 'quizzesPassed' | 'projectsAccepted' | 'challengesCompleted';
      value: number;
    }
  | {
      type: 'course_completed';
      courseId: string;
      pathwayId: string | null;
      coursesCompleted: number;
    };

export type BadgeTier = 'bronze' | 'silver' | 'gold';

export interface Badge extends Timestamped {
  id: string;
  order: number;
  /** lucide icon name. */
  icon: string;
  tier: BadgeTier;
  criteria: BadgeCriteria;
  xpBonus: number;
  isActive: boolean;
  defaultLocale: Locale;
  translations: Localized<{ name: string; description: string }>;
}

/** `users/{uid}/badges/{badgeId}`. `id` equals `badgeId`. */
export interface UserBadge extends Timestamped {
  id: string;
  uid: string;
  badgeId: string;
  awardedAt: IsoDateString;
  /** 'system', or the uid of the person who awarded it. */
  awardedBy: string;
  note: string | null;
}

/** `users/{uid}/xpLedger/{entryId}`. `id` is `${reason}_${refId}`. Append-only. */
export interface XpEntry {
  id: string;
  uid: string;
  amount: number;
  reason: XpReason;
  refId: string;
  courseId: string | null;
  createdAt: IsoDateString;
}

export type CertificateStatus = 'issued' | 'revoked';

/** `certificates/{uid}_{courseId}`: one per user per course. */
export interface Certificate extends Timestamped {
  id: string;
  userUid: string;
  recipientName: string;
  type: 'course';
  courseId: string;
  pathwayId: string | null;
  courseTitle: Localized<{ title: string }>;
  isOfficial: boolean;
  schoolId: string | null;
  schoolName: string | null;
  /** 'system', or the uid of the person who issued it. */
  issuedBy: string;
  issuerName: string;
  verificationCode: string;
  status: CertificateStatus;
  revokedReason: string | null;
  issuedAt: IsoDateString;
  revokedAt: IsoDateString | null;
}

/** What the public verification page may show: no learner name. */
export interface PublicCertificate {
  verificationCode: string;
  status: CertificateStatus;
  courseTitle: Localized<{ title: string }>;
  isOfficial: boolean;
  issuerName: string;
  schoolName: string | null;
  issuedAt: IsoDateString;
}

export interface GamificationOutcome {
  xpAwarded: number;
  xpTotal: number;
  level: number;
  leveledUp: boolean;
  newBadges: Badge[];
  certificate: Certificate | null;
}
