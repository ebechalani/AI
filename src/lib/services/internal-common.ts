import 'server-only';
import { isSystem, type Actor, type Session } from '@/lib/auth/actor';
import { assertRole } from '@/lib/auth/authz';
import { ForbiddenError, LicenseRequiredError, NotFoundError } from '@/lib/errors';
import type { Audience, Localized, Role } from '@/types/common';
import type { Course } from '@/types/content';
import type { GamificationOutcome } from '@/types/gamification';
import type { CriteriaScores, RubricWeight } from '@/types/project';
import { getCourseAccess, type CourseAccess } from './access';

// Private to src/lib/services: what the learning-side services (learning, assessment,
// project-flow, recognition, tutor-context) share. Nothing here is a service function.

// --- Actors ------------------------------------------------------------------------------------

/** For operations a person does in their own name; the system has no name to do them in. */
export function requireSessionActor(actor: Actor, what: string): Session {
  if (isSystem(actor)) throw new ForbiddenError(what);
  return actor;
}

/** A student or a teacher, signed in: the two roles that learn (ARCHITECTURE.md 4.2). */
export function requireLearnerSession(actor: Actor, what: string): Session {
  const session = requireSessionActor(actor, what);
  assertRole(actor, 'student', 'teacher');
  return session;
}

/** The audience a role learns in: students take student courses, teachers the Teacher Academy. */
export function learnerAudience(role: Role): Audience | null {
  if (role === 'student') return 'student';
  if (role === 'teacher') return 'teacher';
  return null;
}

// --- Reads -------------------------------------------------------------------------------------

export async function orNullIfMissing<T>(read: Promise<T>): Promise<T | null> {
  try {
    return await read;
  } catch (error) {
    if (error instanceof NotFoundError) return null;
    throw error;
  }
}

/** A value of a map keyed by ids a client chose, read without touching the prototype. */
export function own<T>(map: Record<string, T>, key: string): T | undefined {
  return Object.hasOwn(map, key) ? map[key] : undefined;
}

/**
 * getCourseAccess as a gate: a course the actor may not see does not exist for them, and a
 * premium course without a cover answers `license_required` (as classroom.assignCourseToClass
 * does).
 */
export async function requireCourseAccess(
  actor: Actor,
  course: Course,
): Promise<Extract<CourseAccess, { allowed: true }>> {
  const access = await getCourseAccess(actor, course);
  if (access.allowed) return access;
  if (access.reason === 'license_required') {
    throw new LicenseRequiredError(`courses/${course.id} needs a licence.`);
  }
  throw new NotFoundError(`courses/${course.id} does not exist.`);
}

/** The `{ title }` of every locale of a translated document, for list snapshots (3.4). */
export function titleSnapshot<T extends { title: string }>(
  translations: Localized<T>,
): Localized<{ title: string }> {
  return Object.fromEntries(
    Object.entries(translations).flatMap(([locale, entry]) =>
      entry ? [[locale, { title: entry.title }]] : [],
    ),
  );
}

// --- Gamification ------------------------------------------------------------------------------

/**
 * Runs a gamification handler after the state transaction that it follows (ARCHITECTURE.md
 * 9.4). The learner's operation has succeeded by then, so a handler that fails is logged and
 * answered with null: it left `effectsApplied` false, and the next read runs it again.
 */
export async function applyEffects(
  what: string,
  handler: () => Promise<GamificationOutcome>,
): Promise<GamificationOutcome | null> {
  try {
    return await handler();
  } catch (error) {
    console.error(`[services] ${what} failed; its effects stay pending`, error);
    return null;
  }
}

// --- Review scores -----------------------------------------------------------------------------

/**
 * round(sum of score x weight / 100) over the submission's rubric, 0-100. A criterion the
 * rubric does not list weighs nothing; a rubric that lists nothing scores 0.
 */
export function weightedScore(criteria: CriteriaScores, rubric: readonly RubricWeight[]): number {
  const total = rubric.reduce((sum, { key, weight }) => sum + criteria[key] * weight, 0);
  return Math.max(0, Math.min(100, Math.round(total / 100)));
}
