import 'server-only';
import type { CollectionReference, DocumentReference } from 'firebase-admin/firestore';
import type { RateLimitScope } from '@/lib/limits';
import type { XpReason } from '@/types/gamification';
import { getAdminDb } from './admin';

// The collection map of ARCHITECTURE.md 3.3: every path is spelled here once, and repositories
// take their references from these builders. A document is `collections.x(…).doc(id)`.

function at(path: string): CollectionReference {
  return getAdminDb().collection(path);
}

export const collections = {
  users: () => at('users'),
  userBadges: (uid: string) => at(`users/${uid}/badges`),
  userXpLedger: (uid: string) => at(`users/${uid}/xpLedger`),

  schools: () => at('schools'),
  classes: () => at('classes'),
  classMembers: (classId: string) => at(`classes/${classId}/members`),
  classAssignments: (classId: string) => at(`classes/${classId}/assignments`),
  joinCodes: () => at('joinCodes'),

  pathways: () => at('pathways'),
  courses: () => at('courses'),
  modules: (courseId: string) => at(`courses/${courseId}/modules`),
  lessons: (courseId: string) => at(`courses/${courseId}/lessons`),
  blocks: (courseId: string, lessonId: string) =>
    at(`courses/${courseId}/lessons/${lessonId}/blocks`),
  quizzes: (courseId: string) => at(`courses/${courseId}/quizzes`),
  /** Holds one document, the answer key: see quizKeyDoc(). */
  quizPrivate: (courseId: string, quizId: string) =>
    at(`courses/${courseId}/quizzes/${quizId}/private`),
  projects: (courseId: string) => at(`courses/${courseId}/projects`),

  enrollments: () => at('enrollments'),
  lessonProgress: (enrollmentId: string) => at(`enrollments/${enrollmentId}/lessonProgress`),
  quizAttempts: () => at('quizAttempts'),
  submissions: () => at('submissions'),
  reviews: (submissionId: string) => at(`submissions/${submissionId}/reviews`),
  aiReviews: (submissionId: string) => at(`submissions/${submissionId}/aiReviews`),
  files: () => at('files'),

  badges: () => at('badges'),
  certificates: () => at('certificates'),
  challenges: () => at('challenges'),
  subscriptions: () => at('subscriptions'),
  licenses: () => at('licenses'),
  hardwarePlatforms: () => at('hardwarePlatforms'),

  aiUsage: () => at('aiUsage'),
  uploadUsage: () => at('uploadUsage'),
  rateLimits: () => at('rateLimits'),
  auditLogs: () => at('auditLogs'),
  meta: () => at('meta'),
} as const;

export type CollectionName = keyof typeof collections;

/** `courses/{courseId}/quizzes/{quizId}/private/key`: the server-only answer key. */
export function quizKeyDoc(courseId: string, quizId: string): DocumentReference {
  return collections.quizPrivate(courseId, quizId).doc('key');
}

/** `meta/migrations`: which migrations have run. */
export function migrationsDoc(): DocumentReference {
  return collections.meta().doc('migrations');
}

// Deterministic ids (ARCHITECTURE.md 3.1). A single id never contains '_', so each composite
// reads in one way only. `day` is the UTC date as yyyymmdd, `hour` as yyyymmddhh.
export const docIds = {
  enrollment: (uid: string, courseId: string) => `${uid}_${courseId}`,
  quizAttempt: (uid: string, courseId: string, quizId: string, attemptNumber: number) =>
    `${uid}_${courseId}_${quizId}_${attemptNumber}`,
  projectSubmission: (uid: string, courseId: string, projectId: string, attemptNumber: number) =>
    `${uid}_p_${courseId}_${projectId}_${attemptNumber}`,
  challengeSubmission: (uid: string, challengeId: string, attemptNumber: number) =>
    `${uid}_c_${challengeId}_${attemptNumber}`,
  certificate: (uid: string, courseId: string) => `${uid}_${courseId}`,
  xpEntry: (reason: XpReason, refId: string) => `${reason}_${refId}`,
  userAiUsage: (uid: string, day: string) => `${uid}_${day}`,
  schoolAiUsage: (schoolId: string, day: string) => `school_${schoolId}_${day}`,
  globalAiUsage: (day: string) => `global_${day}`,
  uploadUsage: (uid: string, day: string) => `${uid}_${day}`,
  rateLimit: (scope: RateLimitScope, keyHash: string, hour: string) =>
    `${scope}_${keyHash}_${hour}`,
} as const;

/** The UTC date of an instant as `yyyymmdd`, the day part of the counter ids. */
export function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10).replaceAll('-', '');
}

/** The UTC hour of an instant as `yyyymmddhh`, the window part of a rate-limit id. */
export function utcHourKey(date: Date): string {
  return `${utcDayKey(date)}${date.toISOString().slice(11, 13)}`;
}
