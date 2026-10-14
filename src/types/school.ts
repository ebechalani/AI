import type { AgeBand, IsoDateString, Locale, Timestamped } from './common';

export const SCHOOL_STATUSES = ['active', 'suspended'] as const;
export type SchoolStatus = (typeof SCHOOL_STATUSES)[number];

export interface SchoolSettings {
  /** One switch for the tutor, the AI Lab and AI review. */
  aiEnabled: boolean;
  /** Overrides the student tutor limit; null = the platform default. */
  aiDailyMessageLimit: number | null;
  joinCodesEnabled: boolean;
}

export interface SchoolCounts {
  teachers: number;
  /** Students with status 'active', which is also the number of seats used. */
  students: number;
  classes: number;
}

export interface School extends Timestamped {
  id: string;
  name: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  city: string | null;
  defaultLocale: Locale;
  status: SchoolStatus;
  settings: SchoolSettings;
  counts: SchoolCounts;
  createdByUid: string;
}

export interface SchoolClass extends Timestamped {
  id: string;
  schoolId: string | null;
  name: string;
  gradeLabel: string | null;
  ageBand: AgeBand;
  ownerUid: string;
  teacherUids: string[];
  joinCode: string;
  joinCodeEnabled: boolean;
  joinCodeExpiresAt: IsoDateString | null;
  studentCount: number;
  assignedCourseIds: string[];
  archived: boolean;
}

/** `classes/{classId}/members/{uid}`. `id` is the student's uid. */
export interface ClassMember extends Timestamped {
  id: string;
  classId: string;
  displayName: string;
  username: string | null;
  ageBand: AgeBand;
  /** null = the student joined with the class code. */
  addedByUid: string | null;
  joinedAt: IsoDateString;
}

/** `classes/{classId}/assignments/{courseId}`. `id` equals `courseId`. */
export interface ClassAssignment extends Timestamped {
  id: string;
  classId: string;
  courseId: string;
  assignedByUid: string;
  assignedAt: IsoDateString;
  dueAt: IsoDateString | null;
}
