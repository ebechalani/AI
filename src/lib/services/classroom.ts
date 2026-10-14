import 'server-only';
import { studentAccountPolicy } from '@/lib/auth/account-policy';
import { assertSystem, isSystem, SYSTEM_ACTOR, type Actor, type Session } from '@/lib/auth/actor';
import {
  assertCan,
  assertRole,
  canManageClass,
  canManageSchool,
  canManageUser,
} from '@/lib/auth/authz';
import {
  addMember,
  createClass as createClassRecord,
  findClassByJoinCode,
  getClass,
  listMembers,
  removeAssignment,
  removeMember,
  setAssignment,
  setTeachers,
} from '@/lib/data/classes';
import { getCourse, getCourses } from '@/lib/data/courses';
import {
  listEnrollmentsForUserInClass,
  setEnrollmentClassContext,
  upsertClassEnrollments,
  type NewEnrollment,
} from '@/lib/data/enrollments';
import { consumeRateLimit } from '@/lib/data/rate-limit';
import { getSchool } from '@/lib/data/schools';
import { listOpenSubmissionsForStudent, setSubmissionClassContext } from '@/lib/data/submissions';
import { getUser } from '@/lib/data/users';
import {
  ConflictError,
  ForbiddenError,
  LicenseRequiredError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from '@/lib/errors';
import { CONTENT_LIMITS, type RateLimitScope } from '@/lib/limits';
import { joinCodeSchema } from '@/lib/schemas/auth';
import { classInputSchema } from '@/lib/schemas/class';
import { parseInput } from '@/lib/schemas/common';
import type { AgeBand, IsoDateString } from '@/types/common';
import type { ClassInput } from '@/types/inputs';
import type { Course } from '@/types/content';
import type { School, SchoolClass } from '@/types/school';
import type { StudentSummary, UserProfile } from '@/types/user';
import { getCourseAccess } from './access';
import { applyIdentityChange } from './identity';

// Classes, rosters, join codes and assignments (ARCHITECTURE.md 10.3). This module keeps the
// live `classId`/`schoolId` of enrollments and open submissions current (3.6) and attaches a
// student to a school, or detaches them, through services/identity.

interface ClassContext {
  classId: string | null;
  schoolId: string | null;
}

function requireSessionActor(actor: Actor, what: string): Session {
  if (isSystem(actor)) throw new ForbiddenError(what);
  return actor;
}

async function consume(scope: RateLimitScope, key: string): Promise<void> {
  const limit = await consumeRateLimit(scope, key);
  if (!limit.allowed) throw new RateLimitError(limit.retryAfterSeconds);
}

async function orNullIfMissing<T>(read: Promise<T>): Promise<T | null> {
  try {
    return await read;
  } catch (error) {
    if (error instanceof NotFoundError) return null;
    throw error;
  }
}

/** The classes of `classIds` that still exist, lowest id first. */
async function loadExistingClasses(classIds: readonly string[]): Promise<SchoolClass[]> {
  const classes = await Promise.all(
    classIds.map((classId) => orNullIfMissing(getClass(SYSTEM_ACTOR, classId))),
  );
  return classes
    .filter((cls): cls is SchoolClass => cls !== null)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// --- Class context (section 3.4) ---------------------------------------------------------------

/**
 * The class that supervises a learner's work in a course, among the classes they are in: the
 * one with the lowest id that has the course assigned, else the one with the lowest id, else
 * none. For a challenge (`courseId` null) the second rule applies directly.
 */
export function pickSupervisingClass(
  classes: readonly SchoolClass[],
  courseId: string | null,
): SchoolClass | null {
  const sorted = [...classes].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const assigning =
    courseId === null ? [] : sorted.filter((cls) => cls.assignedCourseIds.includes(courseId));
  return assigning[0] ?? sorted[0] ?? null;
}

function contextOf(
  classes: readonly SchoolClass[],
  userSchoolId: string | null,
  courseId: string | null,
): ClassContext {
  const chosen = pickSupervisingClass(classes, courseId);
  if (chosen === null) return { classId: null, schoolId: userSchoolId };
  return { classId: chosen.id, schoolId: chosen.schoolId ?? userSchoolId };
}

/**
 * Internal helper (no actor): `classId` and `schoolId` for a new enrollment or submission of
 * `uid` in `courseId` (null for a challenge entry). The school is the supervising class's,
 * else the user's own.
 */
export async function resolveClassContext(
  uid: string,
  courseId: string | null,
): Promise<ClassContext> {
  const profile = await getUser(SYSTEM_ACTOR, uid);
  const classes = await loadExistingClasses(profile.classIds);
  return contextOf(classes, profile.schoolId, courseId);
}

// --- Join codes ---------------------------------------------------------------------------------

export interface JoinCodeTarget {
  cls: SchoolClass;
  school: School | null;
}

/**
 * Internal helper: the class behind a join code that is accepting students right now. An
 * unknown, malformed, disabled or expired code, and a code of a school that has switched join
 * codes off, all answer the same NotFoundError, so a caller learns nothing about which it was.
 */
export async function resolveJoinCode(joinCode: string): Promise<JoinCodeTarget> {
  const notFound = () => new NotFoundError('No class accepts this join code.');
  const parsed = parseInput(joinCodeSchema, joinCode);
  if (!parsed.success) throw notFound();
  const cls = await findClassByJoinCode(SYSTEM_ACTOR, parsed.data);
  if (
    cls === null ||
    !cls.joinCodeEnabled ||
    cls.joinCodeExpiresAt === null ||
    Date.parse(cls.joinCodeExpiresAt) <= Date.now()
  ) {
    throw notFound();
  }
  const school = cls.schoolId === null ? null : await getSchool(SYSTEM_ACTOR, cls.schoolId);
  if (school !== null && !school.settings.joinCodesEnabled) throw notFound();
  return { cls, school };
}

/**
 * Internal helper: what studentAccountPolicy needs to know about a class. The owner is read
 * only for a class without a school; a disabled owner no longer vouches for anyone.
 */
export async function studentAccountContext(
  target: JoinCodeTarget,
): Promise<{ schoolActive: boolean; ownerVerifiedEducator: boolean }> {
  if (target.cls.schoolId !== null) {
    return { schoolActive: target.school?.status === 'active', ownerVerifiedEducator: false };
  }
  const owner = await getUser(SYSTEM_ACTOR, target.cls.ownerUid);
  return {
    schoolActive: false,
    ownerVerifiedEducator:
      owner.role === 'teacher' && owner.status === 'active' && owner.verifiedEducator,
  };
}

export async function lookupJoinCode(
  joinCode: string,
  ctx: { clientKey: string },
): Promise<{ className: string; accountCreation: boolean; under13Allowed: boolean }> {
  await consume('join_lookup', ctx.clientKey);
  const target = await resolveJoinCode(joinCode);
  const policyContext = await studentAccountContext(target);
  const allows = (ageBand: AgeBand) =>
    studentAccountPolicy(target.cls, policyContext, ageBand).allowed;
  return {
    className: target.cls.name,
    accountCreation: allows('adult'),
    under13Allowed: allows('8-10'),
  };
}

/** A signed-in student joins a class with its code; no account is created (section 1.5, path 4). */
export async function joinClassWithCode(actor: Actor, joinCode: string): Promise<SchoolClass> {
  const session = requireSessionActor(actor, 'class.join');
  assertRole(actor, 'student');
  await consume('join_class', session.uid);
  const { cls } = await resolveJoinCode(joinCode);

  const student = await getUser(actor, session.uid);
  if (student.schoolId !== null && student.schoolId !== cls.schoolId) {
    throw new ConflictError('A student of a school can only join classes of that school.');
  }
  await addStudentToClass(SYSTEM_ACTOR, cls.id, student, null);
  return getClass(SYSTEM_ACTOR, cls.id);
}

// --- Roster -------------------------------------------------------------------------------------

async function enrollInAssignedCourses(
  cls: SchoolClass,
  studentUids: readonly string[],
): Promise<void> {
  if (cls.assignedCourseIds.length === 0 || studentUids.length === 0) return;
  const courses = await getCourses(SYSTEM_ACTOR, cls.assignedCourseIds);
  const inputs: NewEnrollment[] = courses.flatMap((course) =>
    studentUids.map((userUid) => classEnrollment(cls, course, userUid)),
  );
  await upsertClassEnrollments(SYSTEM_ACTOR, inputs);
}

function classEnrollment(cls: SchoolClass, course: Course, userUid: string): NewEnrollment {
  return {
    userUid,
    courseId: course.id,
    classId: cls.id,
    schoolId: cls.schoolId,
    source: 'class',
    totalLessonCount: course.lessonCount,
  };
}

/**
 * Points the student's open submissions that `filter` selects at the class that now reviews
 * them, as resolveClassContext decides after the roster change.
 */
async function repointOpenSubmissions(
  uid: string,
  filter: { classId: string | null },
  resolve: (courseId: string | null) => ClassContext,
): Promise<void> {
  const open = await listOpenSubmissionsForStudent(SYSTEM_ACTOR, uid, filter);
  for (const submission of open) {
    const context = resolve(submission.courseId);
    if (context.classId === submission.classId && context.schoolId === submission.schoolId) {
      continue;
    }
    await setSubmissionClassContext(SYSTEM_ACTOR, submission.id, context);
  }
}

/**
 * System only; used by joinClassWithCode and by provisioning. Adds the roster entry (which
 * also maintains `users.classIds`), attaches a school-less student to the class's school
 * without ending their session, enrols them in every assigned course and gives their
 * unsupervised open submissions a reviewing class.
 */
export async function addStudentToClass(
  actor: Actor,
  classId: string,
  student: UserProfile,
  addedByUid: string | null,
): Promise<void> {
  assertSystem(actor);
  const cls = await getClass(SYSTEM_ACTOR, classId);
  await addMember(SYSTEM_ACTOR, classId, student, addedByUid);

  let schoolId = student.schoolId;
  if (schoolId === null && cls.schoolId !== null) {
    await applyIdentityChange(
      student.id,
      { schoolId: cls.schoolId },
      { invalidateSessions: false },
    );
    schoolId = cls.schoolId;
  }
  await enrollInAssignedCourses(cls, [student.id]);

  const after = await getUser(SYSTEM_ACTOR, student.id);
  const classes = await loadExistingClasses(after.classIds);
  await repointOpenSubmissions(student.id, { classId: null }, (courseId) =>
    contextOf(classes, schoolId, courseId),
  );
}

/**
 * Takes the student off the roster, re-resolves the enrollments and open submissions this
 * class supervised, and returns a self-registered (email) student to `schoolId: null` when
 * this was their last class in that school.
 */
export async function removeStudentFromClass(
  actor: Actor,
  classId: string,
  studentUid: string,
): Promise<void> {
  const cls = await getClass(actor, classId);
  assertCan(canManageClass(actor, cls), 'class.manage');
  const members = await listMembers(actor, classId);
  if (!members.some((member) => member.id === studentUid)) {
    throw new NotFoundError(`users/${studentUid} is not a member of classes/${classId}.`);
  }
  await removeMember(SYSTEM_ACTOR, classId, studentUid);

  const student = await getUser(SYSTEM_ACTOR, studentUid);
  const classes = await loadExistingClasses(student.classIds);
  let schoolId = student.schoolId;
  if (
    student.username === null &&
    schoolId !== null &&
    schoolId === cls.schoolId &&
    !classes.some((remaining) => remaining.schoolId === schoolId)
  ) {
    await applyIdentityChange(studentUid, { schoolId: null }, { invalidateSessions: false });
    schoolId = null;
  }
  const resolve = (courseId: string | null) => contextOf(classes, schoolId, courseId);

  const enrollments = await listEnrollmentsForUserInClass(SYSTEM_ACTOR, studentUid, classId);
  for (const enrollment of enrollments) {
    await setEnrollmentClassContext(
      SYSTEM_ACTOR,
      studentUid,
      enrollment.courseId,
      resolve(enrollment.courseId),
    );
  }
  await repointOpenSubmissions(studentUid, { classId }, resolve);
}

/**
 * The reduced view a teacher gets of a pupil of their class: never the full profile
 * (data/users.getUser refuses teachers, so the profile is read as the system once the
 * membership has been checked).
 */
export async function getStudentForTeacher(
  actor: Actor,
  classId: string,
  studentUid: string,
): Promise<StudentSummary> {
  const cls = await getClass(actor, classId);
  assertCan(canManageClass(actor, cls), 'class.manage');
  const members = await listMembers(actor, classId);
  if (!members.some((member) => member.id === studentUid)) {
    throw new NotFoundError(`users/${studentUid} is not a member of classes/${classId}.`);
  }
  const profile = await getUser(SYSTEM_ACTOR, studentUid);
  return {
    uid: profile.id,
    displayName: profile.displayName,
    username: profile.username,
    ageBand: profile.ageBand,
    avatarId: profile.avatarId,
    status: profile.status,
    xpTotal: profile.xpTotal,
    level: profile.level,
    canResetPassword: profile.username !== null && canManageUser(actor, profile),
  };
}

// --- Classes and teachers -----------------------------------------------------------------------

/**
 * A teacher creates a class they own, in their school or none. A school admin (or a platform
 * admin) names the owner: an active teacher, of the admin's own school for a school admin.
 */
export async function createClass(actor: Actor, input: ClassInput): Promise<SchoolClass> {
  const session = requireSessionActor(actor, 'class.create');
  assertRole(actor, 'teacher', 'school_admin', 'platform_admin');
  const parsed = parseInput(classInputSchema, input);
  if (!parsed.success) throw new ValidationError('Invalid class.', parsed.fieldErrors);
  const { name, gradeLabel, ageBand, ownerUid } = parsed.data;

  let owner: Pick<UserProfile, 'id' | 'schoolId'>;
  if (session.role === 'teacher') {
    owner = { id: session.uid, schoolId: session.schoolId };
  } else {
    if (ownerUid === undefined) {
      throw new ValidationError('The class needs an owner.', { ownerUid: ['required'] });
    }
    // A school admin reads only users of their school; anyone else is not found.
    const profile = await getUser(actor, ownerUid);
    if (profile.role !== 'teacher' || profile.status !== 'active') {
      throw new ValidationError('The owner must be an active teacher.', {
        ownerUid: ['invalid_choice'],
      });
    }
    owner = profile;
  }
  return createClassRecord(SYSTEM_ACTOR, {
    schoolId: owner.schoolId,
    name,
    gradeLabel,
    ageBand,
    ownerUid: owner.id,
  });
}

/**
 * Replaces the class's teachers (section 4.4): every uid an active teacher of the class's
 * school, the owner among them; a class without a school has exactly its owner. In a school
 * the school's admin decides who teaches a class, so a co-teacher cannot.
 */
export async function setClassTeachers(
  actor: Actor,
  classId: string,
  teacherUids: string[],
): Promise<void> {
  const cls = await getClass(actor, classId);
  assertCan(
    canManageClass(actor, cls) && (cls.schoolId === null || canManageSchool(actor, cls.schoolId)),
    'class.teachers.set',
  );
  const unique = [...new Set(teacherUids)];
  if (unique.length === 0) {
    throw new ValidationError('A class has at least one teacher.', { teacherUids: ['required'] });
  }
  if (unique.length > CONTENT_LIMITS.teachersPerClass) {
    throw new ValidationError('Too many teachers.', { teacherUids: ['too_many'] });
  }
  if (!unique.includes(cls.ownerUid)) {
    throw new ConflictError('The owner of a class is always one of its teachers.');
  }
  if (cls.schoolId === null) {
    if (unique.length !== 1) {
      throw new ConflictError('A class without a school has exactly its owner as teacher.');
    }
  } else {
    const profiles = await Promise.all(
      unique.map((uid) => orNullIfMissing(getUser(SYSTEM_ACTOR, uid))),
    );
    const eligible = profiles.every(
      (profile) =>
        profile !== null &&
        profile.role === 'teacher' &&
        profile.status === 'active' &&
        profile.schoolId === cls.schoolId,
    );
    if (!eligible) {
      throw new ValidationError('Every teacher must be an active teacher of the school.', {
        teacherUids: ['invalid_choice'],
      });
    }
  }
  await setTeachers(SYSTEM_ACTOR, classId, unique);
}

// --- Assignments --------------------------------------------------------------------------------

/**
 * Assigns a published course the actor may open (a premium course needs a covering licence)
 * and enrols every member, adopting their unsupervised enrollments and open submissions of
 * that course.
 */
export async function assignCourseToClass(
  actor: Actor,
  classId: string,
  courseId: string,
  dueAt: IsoDateString | null,
): Promise<void> {
  const cls = await getClass(actor, classId);
  assertCan(canManageClass(actor, cls), 'class.manage');
  const course = await getCourse(actor, courseId);
  const access = await getCourseAccess(actor, course);
  if (!access.allowed) {
    if (access.reason === 'license_required') {
      throw new LicenseRequiredError(`courses/${courseId} needs a licence.`);
    }
    throw new NotFoundError(`courses/${courseId} does not exist.`);
  }
  if (course.audience !== 'student') {
    throw new ConflictError('Only courses for students can be assigned to a class.');
  }
  // The members get enrolled, which freezes the course's structure (3.1) and, for a
  // teacher-made course, makes it visible to them: only a published course is assigned.
  if (course.status !== 'published') {
    throw new ConflictError(`courses/${courseId} is not published.`);
  }
  await setAssignment(actor, classId, courseId, dueAt);

  const members = await listMembers(actor, classId);
  if (members.length === 0) return;
  await upsertClassEnrollments(
    SYSTEM_ACTOR,
    members.map((member) => classEnrollment(cls, course, member.id)),
  );
  const context: ClassContext = { classId: cls.id, schoolId: cls.schoolId };
  await Promise.all(
    members.map(async (member) => {
      const open = await listOpenSubmissionsForStudent(SYSTEM_ACTOR, member.id, {
        courseId,
        classId: null,
      });
      for (const submission of open) {
        await setSubmissionClassContext(SYSTEM_ACTOR, submission.id, context);
      }
    }),
  );
}

/** Existing enrollments keep their class: the students simply lose the assignment. */
export async function unassignCourseFromClass(
  actor: Actor,
  classId: string,
  courseId: string,
): Promise<void> {
  const cls = await getClass(actor, classId);
  assertCan(canManageClass(actor, cls), 'class.manage');
  await removeAssignment(actor, classId, courseId);
}
