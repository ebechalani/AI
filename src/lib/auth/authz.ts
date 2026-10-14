import 'server-only';
import { ForbiddenError } from '@/lib/errors';
import type { Role } from '@/types/common';
import type { Challenge } from '@/types/challenge';
import type { Course } from '@/types/content';
import type { Certificate } from '@/types/gamification';
import type { Submission } from '@/types/project';
import type { SchoolClass } from '@/types/school';
import type { UserProfile } from '@/types/user';
import { isSystem, type Actor } from './actor';

// Pure, synchronous predicates over the session and a loaded resource (ARCHITECTURE.md 4.4).
// A SystemActor passes every one of them.
//
// Two tiers. The scope tests (hasRole, inSchool, teachesClass, teachesAnyOf) say exactly what
// their name says: a platform admin has no school and teaches no class, so only isPlatformAdmin
// is true for them. The can* predicates are the decisions, and each one lets a platform admin
// through, apart from the one thing nobody may do: change their own role.

// --- Scopes ------------------------------------------------------------------------------------

export function hasRole(actor: Actor, ...roles: Role[]): boolean {
  return isSystem(actor) || roles.includes(actor.role);
}

export function isPlatformAdmin(actor: Actor): boolean {
  return hasRole(actor, 'platform_admin');
}

/** Individual users and resources have `schoolId: null` and never match a school scope. */
export function inSchool(actor: Actor, schoolId: string | null): boolean {
  if (isSystem(actor)) return true;
  return schoolId !== null && actor.schoolId !== null && actor.schoolId === schoolId;
}

/**
 * `classIds` means "member of" for a student and "teaches" for a teacher, so the role is part
 * of the test: a student never passes, whatever their `classIds`.
 */
export function teachesClass(actor: Actor, classId: string | null): boolean {
  if (isSystem(actor)) return true;
  return actor.role === 'teacher' && classId !== null && actor.classIds.includes(classId);
}

export function teachesAnyOf(actor: Actor, classIds: string[]): boolean {
  if (isSystem(actor)) return true;
  return actor.role === 'teacher' && classIds.some((classId) => actor.classIds.includes(classId));
}

function isSchoolAdminOf(actor: Actor, schoolId: string | null): boolean {
  return hasRole(actor, 'school_admin') && inSchool(actor, schoolId);
}

function isSelf(actor: Actor, uid: string): boolean {
  return !isSystem(actor) && actor.uid === uid;
}

// --- Users -------------------------------------------------------------------------------------

/** A teacher who passes still receives the reduced StudentSummary, never the full profile. */
export function canViewUser(actor: Actor, target: UserProfile): boolean {
  if (isPlatformAdmin(actor) || isSelf(actor, target.id)) return true;
  if (isSchoolAdminOf(actor, target.schoolId)) return true;
  return target.role === 'student' && teachesAnyOf(actor, target.classIds);
}

/**
 * A teacher manages only username accounts in a class they teach, and only ones they created
 * themselves or that belong to their own school: a pupil of another school who merely joined
 * the class cannot be taken over.
 */
export function canManageUser(actor: Actor, target: UserProfile): boolean {
  if (isPlatformAdmin(actor)) return true;
  if (isSchoolAdminOf(actor, target.schoolId)) {
    return target.role === 'teacher' || target.role === 'student';
  }
  if (isSystem(actor) || actor.role !== 'teacher') return false;
  return (
    target.role === 'student' &&
    target.username !== null &&
    teachesAnyOf(actor, target.classIds) &&
    (target.provisionedByUid === actor.uid || inSchool(actor, target.schoolId))
  );
}

/** Nobody changes their own role, a platform admin included. */
export function canAssignRole(
  actor: Actor,
  target: UserProfile,
  role: Role,
  schoolId: string | null,
): boolean {
  if (isSystem(actor)) return true;
  if (actor.uid === target.id) return false;
  if (actor.role === 'platform_admin') return true;
  return (
    actor.role === 'school_admin' &&
    canManageUser(actor, target) &&
    (role === 'student' || role === 'teacher') &&
    schoolId !== null &&
    schoolId === actor.schoolId
  );
}

// --- Schools and classes -----------------------------------------------------------------------

export function canViewSchool(actor: Actor, schoolId: string): boolean {
  return isPlatformAdmin(actor) || inSchool(actor, schoolId);
}

export function canManageSchool(actor: Actor, schoolId: string): boolean {
  return isPlatformAdmin(actor) || isSchoolAdminOf(actor, schoolId);
}

/** A student who passes sees the class name and its assignments, never the roster. */
export function canViewClass(actor: Actor, cls: SchoolClass): boolean {
  if (canManageClass(actor, cls)) return true;
  return !isSystem(actor) && actor.role === 'student' && actor.classIds.includes(cls.id);
}

/** Required by every roster function. */
export function canManageClass(actor: Actor, cls: SchoolClass): boolean {
  if (isPlatformAdmin(actor) || isSchoolAdminOf(actor, cls.schoolId)) return true;
  return !isSystem(actor) && actor.role === 'teacher' && cls.teacherUids.includes(actor.uid);
}

// --- Courses -----------------------------------------------------------------------------------

/**
 * Whether the course exists for this actor at all. Access to premium content is a second
 * question, answered by services/access.getCourseAccess.
 */
export function canViewCourse(actor: Actor, course: Course, ctx: { enrolled: boolean }): boolean {
  if (isPlatformAdmin(actor) || isSelf(actor, course.ownerUid)) return true;
  if (course.isOfficial) {
    return (
      course.status === 'published' && (course.audience === 'student' || !hasRole(actor, 'student'))
    );
  }
  if (isSchoolAdminOf(actor, course.schoolId)) return true;
  if (
    course.visibility === 'school' &&
    hasRole(actor, 'teacher') &&
    inSchool(actor, course.schoolId)
  ) {
    return true;
  }
  return ctx.enrolled;
}

export function canEditCourse(actor: Actor, course: Course): boolean {
  if (isPlatformAdmin(actor)) return true;
  return !course.isOfficial && hasRole(actor, 'teacher') && isSelf(actor, course.ownerUid);
}

// --- Learner records ---------------------------------------------------------------------------

/**
 * Enrollments, quiz attempts, progress. A teacher reaches a record only through the class it
 * was made in, never through the student: what the same student did in another teacher's
 * class, or alone, stays out of reach.
 */
export function canViewLearnerRecord(
  actor: Actor,
  record: { userUid: string; schoolId: string | null; classId: string | null },
): boolean {
  if (isPlatformAdmin(actor) || isSelf(actor, record.userUid)) return true;
  return teachesClass(actor, record.classId) || isSchoolAdminOf(actor, record.schoolId);
}

export function canViewSubmission(actor: Actor, submission: Submission): boolean {
  if (isPlatformAdmin(actor) || isSelf(actor, submission.studentUid)) return true;
  return teachesClass(actor, submission.classId) || isSchoolAdminOf(actor, submission.schoolId);
}

export function canReviewSubmission(actor: Actor, submission: Submission): boolean {
  return isPlatformAdmin(actor) || teachesClass(actor, submission.classId);
}

/** The student sees the AI review only in the unsupervised flow, where no teacher exists. */
export function canViewAiReview(actor: Actor, submission: Submission): boolean {
  if (canReviewSubmission(actor, submission)) return true;
  return submission.classId === null && isSelf(actor, submission.studentUid);
}

// --- Certificates and challenges ---------------------------------------------------------------

/** The further conditions of ARCHITECTURE.md 9.5 are checked by services/recognition. */
export function canIssueCertificate(actor: Actor, student: UserProfile): boolean {
  if (isPlatformAdmin(actor)) return true;
  return student.role === 'student' && teachesAnyOf(actor, student.classIds);
}

/** A teacher who shares a class with the holder is let in by the caller, through canViewUser. */
export function canViewCertificate(actor: Actor, certificate: Certificate): boolean {
  if (isPlatformAdmin(actor) || isSelf(actor, certificate.userUid)) return true;
  return isSchoolAdminOf(actor, certificate.schoolId);
}

export function canViewChallenge(actor: Actor, challenge: Challenge): boolean {
  if (isPlatformAdmin(actor)) return true;
  return (
    challenge.status === 'published' &&
    (challenge.scope === 'global' || inSchool(actor, challenge.schoolId))
  );
}

// --- Assertions --------------------------------------------------------------------------------

export function assertRole(actor: Actor, ...roles: Role[]): void {
  if (!hasRole(actor, ...roles)) throw new ForbiddenError(`Requires role ${roles.join(' or ')}.`);
}

/** `what` names the refused operation ('submission.view') for the server log. */
export function assertCan(allowed: boolean, what: string): asserts allowed {
  if (!allowed) throw new ForbiddenError(what);
}
