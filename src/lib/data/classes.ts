import 'server-only';
import { randomInt } from 'node:crypto';
import {
  FieldValue,
  Timestamp,
  type DocumentReference,
  type Transaction,
} from 'firebase-admin/firestore';
import { assertSystem, type Actor } from '@/lib/auth/actor';
import {
  assertCan,
  assertRole,
  canManageClass,
  canManageSchool,
  canViewClass,
} from '@/lib/auth/authz';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors';
import { getAdminDb } from '@/lib/firebase/admin';
import { collections } from '@/lib/firebase/collections';
import {
  createdNow,
  fromQuery,
  fromSnapshot,
  fromSnapshotOrNull,
  serverTimestamp,
  toTimestampOrNull,
  updatedNow,
} from '@/lib/firebase/converters';
import { CONTENT_LIMITS, JOIN_CODE } from '@/lib/limits';
import { updateClassInputSchema } from '@/lib/schemas/class';
import { parseInput } from '@/lib/schemas/common';
import type { AgeBand, IsoDateString } from '@/types/common';
import type { ClassAssignment, ClassMember, School, SchoolClass } from '@/types/school';
import type { UserProfile } from '@/types/user';
import { actorUid, assertId, userDoc } from './internal-identity';

/** Built by services/classroom.createClass, which has validated the owner. */
export interface NewClass {
  schoolId: string | null;
  name: string;
  gradeLabel: string | null;
  ageBand: AgeBand;
  /** An active teacher; in a school class, a teacher of that school. */
  ownerUid: string;
}

const JOIN_CODE_PATTERN = new RegExp(`^[${JOIN_CODE.alphabet}]{${JOIN_CODE.length}}$`);
const JOIN_CODE_TTL_MS = JOIN_CODE.ttlHours * 60 * 60 * 1000;
const classPatchSchema = updateClassInputSchema.omit({ classId: true });

function classDoc(classId: string): DocumentReference {
  assertId(classId);
  return collections.classes().doc(classId);
}

function newJoinCode(): string {
  let code = '';
  for (let index = 0; index < JOIN_CODE.length; index += 1) {
    code += JOIN_CODE.alphabet[randomInt(JOIN_CODE.alphabet.length)];
  }
  return code;
}

/** A code no class holds. The caller creates its joinCodes document in the same transaction. */
async function pickFreeJoinCode(tx: Transaction): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = newJoinCode();
    const taken = await tx.get(collections.joinCodes().doc(code));
    if (!taken.exists) return code;
  }
  throw new Error('No free join code after five draws.');
}

function joinCodeExpiry(): Timestamp {
  return Timestamp.fromMillis(Date.now() + JOIN_CODE_TTL_MS);
}

/** A class the actor cannot see does not exist for them; one they can see but not run is refused. */
function assertManages(actor: Actor, cls: SchoolClass | null, classId: string): SchoolClass {
  if (cls === null || !canViewClass(actor, cls)) {
    throw new NotFoundError(`classes/${classId} does not exist.`);
  }
  assertCan(canManageClass(actor, cls), 'class.manage');
  return cls;
}

function assertNotArchived(cls: SchoolClass): void {
  if (cls.archived) throw new ConflictError(`classes/${cls.id} is archived.`);
}

function archivedFilter(includeArchived: boolean | undefined): [string, '==' | 'in', unknown] {
  // The same composite index serves both variants (ARCHITECTURE.md 3.7).
  return includeArchived ? ['archived', 'in', [false, true]] : ['archived', '==', false];
}

// --- Reads -------------------------------------------------------------------------------------

export async function getClass(actor: Actor, classId: string): Promise<SchoolClass> {
  const cls = fromSnapshotOrNull<SchoolClass>(await classDoc(classId).get());
  if (cls === null || !canViewClass(actor, cls)) {
    throw new NotFoundError(`classes/${classId} does not exist.`);
  }
  return cls;
}

/** The classes of `teacherUid` that the actor runs too: all of them for the teacher themselves. */
export async function listClassesForTeacher(
  actor: Actor,
  teacherUid: string,
  opts?: { includeArchived?: boolean },
): Promise<SchoolClass[]> {
  assertRole(actor, 'teacher', 'school_admin', 'platform_admin');
  assertId(teacherUid);
  const snapshot = await collections
    .classes()
    .where('teacherUids', 'array-contains', teacherUid)
    .where(...archivedFilter(opts?.includeArchived))
    .orderBy('name')
    .get();
  return fromQuery<SchoolClass>(snapshot).filter((cls) => canManageClass(actor, cls));
}

export async function listClassesForSchool(
  actor: Actor,
  schoolId: string,
  opts?: { includeArchived?: boolean },
): Promise<SchoolClass[]> {
  assertCan(canManageSchool(actor, schoolId), 'school.classes.list');
  assertId(schoolId);
  const snapshot = await collections
    .classes()
    .where('schoolId', '==', schoolId)
    .where(...archivedFilter(opts?.includeArchived))
    .orderBy('name')
    .get();
  return fromQuery<SchoolClass>(snapshot);
}

/** null for an unknown code. Whether the code is enabled and unexpired is the caller's check. */
export async function findClassByJoinCode(actor: Actor, code: string): Promise<SchoolClass | null> {
  assertSystem(actor);
  if (typeof code !== 'string' || !JOIN_CODE_PATTERN.test(code)) return null;
  const entry = await collections.joinCodes().doc(code).get();
  const classId: unknown = entry.get('classId');
  if (typeof classId !== 'string') return null;
  const cls = fromSnapshotOrNull<SchoolClass>(await collections.classes().doc(classId).get());
  return cls !== null && cls.joinCode === code && !cls.archived ? cls : null;
}

export async function listMembers(actor: Actor, classId: string): Promise<ClassMember[]> {
  assertManages(actor, fromSnapshotOrNull<SchoolClass>(await classDoc(classId).get()), classId);
  const snapshot = await collections.classMembers(classId).orderBy('displayName').get();
  return fromQuery<ClassMember>(snapshot, { classId });
}

/** Members of the class see its assignments too; oldest first. */
export async function listAssignments(actor: Actor, classId: string): Promise<ClassAssignment[]> {
  await getClass(actor, classId);
  const snapshot = await collections.classAssignments(classId).get();
  return fromQuery<ClassAssignment>(snapshot, { classId }).sort((a, b) =>
    a.assignedAt.localeCompare(b.assignedAt),
  );
}

// --- Class lifecycle ---------------------------------------------------------------------------

export async function createClass(actor: Actor, input: NewClass): Promise<SchoolClass> {
  assertSystem(actor);
  const classRef = collections.classes().doc();
  const ownerRef = userDoc(input.ownerUid);
  if (input.schoolId !== null) assertId(input.schoolId);
  const schoolRef = input.schoolId === null ? null : collections.schools().doc(input.schoolId);

  await getAdminDb().runTransaction(async (tx) => {
    const owner = fromSnapshot<UserProfile>(await tx.get(ownerRef));
    if (owner.role !== 'teacher') throw new ConflictError('The class owner must be a teacher.');
    if (owner.classIds.length >= CONTENT_LIMITS.classesPerUser) {
      throw new ConflictError('The owner already teaches the maximum number of classes.');
    }
    if (schoolRef !== null) fromSnapshot<School>(await tx.get(schoolRef));
    const joinCode = await pickFreeJoinCode(tx);

    tx.create(collections.joinCodes().doc(joinCode), {
      classId: classRef.id,
      schoolId: input.schoolId,
      ...createdNow(),
    });
    tx.create(classRef, {
      schoolId: input.schoolId,
      name: input.name,
      gradeLabel: input.gradeLabel,
      ageBand: input.ageBand,
      ownerUid: input.ownerUid,
      teacherUids: [input.ownerUid],
      joinCode,
      joinCodeEnabled: false,
      joinCodeExpiresAt: null,
      studentCount: 0,
      assignedCourseIds: [],
      archived: false,
      ...createdNow(),
    });
    tx.update(ownerRef, { classIds: FieldValue.arrayUnion(classRef.id), ...updatedNow() });
    if (schoolRef !== null) {
      tx.update(schoolRef, { 'counts.classes': FieldValue.increment(1), ...updatedNow() });
    }
  });
  return fromSnapshot<SchoolClass>(await classRef.get());
}

/** Switching the join code on, again or for the first time, opens it for the next 24 hours. */
export async function updateClass(
  actor: Actor,
  classId: string,
  patch: {
    name?: string;
    gradeLabel?: string | null;
    ageBand?: AgeBand;
    joinCodeEnabled?: boolean;
  },
): Promise<SchoolClass> {
  const parsed = parseInput(classPatchSchema, patch);
  if (!parsed.success) throw new ValidationError('Invalid class patch.', parsed.fieldErrors);
  const { name, gradeLabel, ageBand, joinCodeEnabled } = parsed.data;

  const ref = classDoc(classId);
  await getAdminDb().runTransaction(async (tx) => {
    const cls = assertManages(actor, fromSnapshotOrNull<SchoolClass>(await tx.get(ref)), classId);
    assertNotArchived(cls);
    tx.update(ref, {
      name,
      gradeLabel,
      ageBand,
      joinCodeEnabled,
      joinCodeExpiresAt:
        joinCodeEnabled === undefined ? undefined : joinCodeEnabled ? joinCodeExpiry() : null,
      ...updatedNow(),
    });
  });
  return fromSnapshot<SchoolClass>(await ref.get());
}

/** Memberships stay as they are: the class leaves the lists and its join code is released. */
export async function archiveClass(actor: Actor, classId: string): Promise<void> {
  const ref = classDoc(classId);
  await getAdminDb().runTransaction(async (tx) => {
    const cls = assertManages(actor, fromSnapshotOrNull<SchoolClass>(await tx.get(ref)), classId);
    if (cls.archived) return;
    const schoolRef = cls.schoolId === null ? null : collections.schools().doc(cls.schoolId);
    const school = schoolRef === null ? null : await tx.get(schoolRef);

    tx.update(ref, {
      archived: true,
      joinCodeEnabled: false,
      joinCodeExpiresAt: null,
      ...updatedNow(),
    });
    tx.delete(collections.joinCodes().doc(cls.joinCode));
    if (school?.exists) {
      const classes = Number(school.get('counts.classes') ?? 0);
      tx.update(school.ref, { 'counts.classes': Math.max(0, classes - 1), ...updatedNow() });
    }
  });
}

/** Whether the code is switched on does not change; its 24 hours start again. */
export async function regenerateJoinCode(actor: Actor, classId: string): Promise<string> {
  const ref = classDoc(classId);
  return getAdminDb().runTransaction(async (tx) => {
    const cls = assertManages(actor, fromSnapshotOrNull<SchoolClass>(await tx.get(ref)), classId);
    assertNotArchived(cls);
    const joinCode = await pickFreeJoinCode(tx);

    tx.create(collections.joinCodes().doc(joinCode), {
      classId,
      schoolId: cls.schoolId,
      ...createdNow(),
    });
    tx.delete(collections.joinCodes().doc(cls.joinCode));
    tx.update(ref, { joinCode, joinCodeExpiresAt: joinCodeExpiry(), ...updatedNow() });
    return joinCode;
  });
}

// --- Teachers and members ----------------------------------------------------------------------

/** Replaces the class's teachers and keeps `users.classIds` of everyone added or removed in step. */
export async function setTeachers(
  actor: Actor,
  classId: string,
  teacherUids: string[],
): Promise<void> {
  assertSystem(actor);
  const next = [...new Set(teacherUids)];
  next.forEach((uid) => assertId(uid));
  if (next.length > CONTENT_LIMITS.teachersPerClass) {
    throw new ConflictError('A class has at most five teachers.');
  }
  const ref = classDoc(classId);

  await getAdminDb().runTransaction(async (tx) => {
    const cls = fromSnapshot<SchoolClass>(await tx.get(ref));
    if (!next.includes(cls.ownerUid)) {
      throw new ConflictError('The owner of a class is always one of its teachers.');
    }
    const added = next.filter((uid) => !cls.teacherUids.includes(uid));
    const removed = cls.teacherUids.filter((uid) => !next.includes(uid));
    const changed = [...added, ...removed].map((uid) => collections.users().doc(uid));
    const profiles = changed.length > 0 ? await tx.getAll(...changed) : [];

    for (const snapshot of profiles.slice(0, added.length)) {
      const teacher = fromSnapshot<UserProfile>(snapshot);
      if (teacher.role !== 'teacher') {
        throw new ConflictError(`users/${teacher.id} is not a teacher.`);
      }
      if (
        !teacher.classIds.includes(classId) &&
        teacher.classIds.length >= CONTENT_LIMITS.classesPerUser
      ) {
        throw new ConflictError(`users/${teacher.id} teaches the maximum number of classes.`);
      }
      tx.update(snapshot.ref, { classIds: FieldValue.arrayUnion(classId), ...updatedNow() });
    }
    for (const snapshot of profiles.slice(added.length)) {
      if (!snapshot.exists) continue;
      tx.update(snapshot.ref, { classIds: FieldValue.arrayRemove(classId), ...updatedNow() });
    }
    tx.update(ref, { teacherUids: next, ...updatedNow() });
  });
}

/**
 * Idempotent: a student who is already a member stays one, unchanged. The roster entry copies
 * the name, username and age band stored on the profile at this moment, not those of the
 * `student` argument, which may be older.
 */
export async function addMember(
  actor: Actor,
  classId: string,
  student: UserProfile,
  addedByUid: string | null,
): Promise<void> {
  assertSystem(actor);
  const classRef = classDoc(classId);
  const userRef = userDoc(student.id);
  const memberRef = collections.classMembers(classId).doc(student.id);

  await getAdminDb().runTransaction(async (tx) => {
    const [classSnapshot, userSnapshot, member] = await tx.getAll(classRef, userRef, memberRef);
    const cls = fromSnapshot<SchoolClass>(classSnapshot);
    const profile = fromSnapshot<UserProfile>(userSnapshot);
    if (member.exists) return;

    assertNotArchived(cls);
    if (profile.role !== 'student') {
      throw new ConflictError(`users/${profile.id} is not a student.`);
    }
    if (cls.studentCount >= CONTENT_LIMITS.studentsPerClass) {
      throw new ConflictError(`classes/${classId} is full.`);
    }
    if (
      !profile.classIds.includes(classId) &&
      profile.classIds.length >= CONTENT_LIMITS.classesPerUser
    ) {
      throw new ConflictError(`users/${profile.id} is in the maximum number of classes.`);
    }

    tx.create(memberRef, {
      displayName: profile.displayName,
      username: profile.username,
      ageBand: profile.ageBand,
      addedByUid,
      joinedAt: serverTimestamp(),
      ...createdNow(),
    });
    tx.update(classRef, { studentCount: FieldValue.increment(1), ...updatedNow() });
    tx.update(userRef, { classIds: FieldValue.arrayUnion(classId), ...updatedNow() });
  });
}

/** Idempotent: nothing happens when the student is not a member. */
export async function removeMember(
  actor: Actor,
  classId: string,
  studentUid: string,
): Promise<void> {
  assertSystem(actor);
  const classRef = classDoc(classId);
  const userRef = userDoc(studentUid);
  const memberRef = collections.classMembers(classId).doc(studentUid);

  await getAdminDb().runTransaction(async (tx) => {
    const [classSnapshot, userSnapshot, member] = await tx.getAll(classRef, userRef, memberRef);
    if (!member.exists) return;

    tx.delete(memberRef);
    if (classSnapshot.exists) {
      const studentCount = Number(classSnapshot.get('studentCount') ?? 0);
      tx.update(classRef, { studentCount: Math.max(0, studentCount - 1), ...updatedNow() });
    }
    if (userSnapshot.exists) {
      tx.update(userRef, { classIds: FieldValue.arrayRemove(classId), ...updatedNow() });
    }
  });
}

/**
 * Takes a user out of every class in one transaction and empties `users.classIds`: a student
 * leaves the rosters, a teacher leaves `teacherUids` (of an archived class they own, too). It
 * is the step that must come before a role change (provisioning.changeUserRole;
 * users.setIdentity refuses a role change while `classIds` is not empty). ConflictError while
 * the user owns a class that is not archived.
 */
export async function removeUserFromAllClasses(actor: Actor, uid: string): Promise<void> {
  assertSystem(actor);
  const userRef = userDoc(uid);

  await getAdminDb().runTransaction(async (tx) => {
    const profile = fromSnapshot<UserProfile>(await tx.get(userRef));
    const { classIds } = profile;
    if (classIds.length === 0) return;
    const classRefs = classIds.map((classId) => collections.classes().doc(classId));
    const memberRefs = classIds.map((classId) => collections.classMembers(classId).doc(uid));
    const snapshots = await tx.getAll(...classRefs, ...memberRefs);
    const classes = snapshots.slice(0, classIds.length);
    const members = snapshots.slice(classIds.length);

    classes.forEach((snapshot, index) => {
      const cls = fromSnapshotOrNull<SchoolClass>(snapshot);
      if (cls === null) return;
      if (cls.ownerUid === uid && !cls.archived) {
        throw new ConflictError(`users/${uid} owns classes/${cls.id}, which is not archived.`);
      }
      const member = members[index];
      if (member?.exists) {
        tx.delete(member.ref);
        tx.update(snapshot.ref, {
          studentCount: Math.max(0, cls.studentCount - 1),
          ...updatedNow(),
        });
      } else if (cls.teacherUids.includes(uid)) {
        tx.update(snapshot.ref, { teacherUids: FieldValue.arrayRemove(uid), ...updatedNow() });
      }
    });
    tx.update(userRef, { classIds: [], ...updatedNow() });
  });
}

// --- Assignments -------------------------------------------------------------------------------

/** Assigning a course that is already assigned only changes its due date. */
export async function setAssignment(
  actor: Actor,
  classId: string,
  courseId: string,
  dueAt: IsoDateString | null,
): Promise<void> {
  assertId(courseId);
  const classRef = classDoc(classId);
  const assignmentRef = collections.classAssignments(classId).doc(courseId);
  const due = toTimestampOrNull(dueAt);

  await getAdminDb().runTransaction(async (tx) => {
    const [classSnapshot, assignment] = await tx.getAll(classRef, assignmentRef);
    const cls = assertManages(actor, fromSnapshotOrNull<SchoolClass>(classSnapshot), classId);
    assertNotArchived(cls);

    if (assignment.exists) {
      tx.update(assignmentRef, { dueAt: due, ...updatedNow() });
    } else {
      tx.create(assignmentRef, {
        courseId,
        assignedByUid: actorUid(actor),
        assignedAt: serverTimestamp(),
        dueAt: due,
        ...createdNow(),
      });
    }
    tx.update(classRef, { assignedCourseIds: FieldValue.arrayUnion(courseId), ...updatedNow() });
  });
}

export async function removeAssignment(
  actor: Actor,
  classId: string,
  courseId: string,
): Promise<void> {
  assertId(courseId);
  const classRef = classDoc(classId);

  await getAdminDb().runTransaction(async (tx) => {
    assertManages(actor, fromSnapshotOrNull<SchoolClass>(await tx.get(classRef)), classId);
    tx.delete(collections.classAssignments(classId).doc(courseId));
    tx.update(classRef, { assignedCourseIds: FieldValue.arrayRemove(courseId), ...updatedNow() });
  });
}
