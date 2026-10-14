import 'server-only';
import { Timestamp } from 'firebase-admin/firestore';
import { assertSystem, type Actor } from '@/lib/auth/actor';
import { assertCan, canManageSchool, hasRole, inSchool, isPlatformAdmin } from '@/lib/auth/authz';
import { AVATAR_IDS, DEFAULT_AVATAR_ID } from '@/lib/avatars';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors';
import { getAdminDb } from '@/lib/firebase/admin';
import { collections } from '@/lib/firebase/collections';
import { createdNow, fromSnapshot, serverTimestamp, updatedNow } from '@/lib/firebase/converters';
import { parseInput } from '@/lib/schemas/common';
import { profilePatchSchema } from '@/lib/schemas/profile';
import {
  ROLES,
  type AgeBand,
  type Locale,
  type Page,
  type PageRequest,
  type Role,
} from '@/types/common';
import type { ProfilePatch } from '@/types/inputs';
import type { ConsentBasis, UserProfile, UserStats, UserStatus } from '@/types/user';
import {
  assertId,
  isActorUid,
  isAlreadyExists,
  readPage,
  readProfile,
  updateExisting,
  userDoc,
} from './internal-identity';

/**
 * What a service decides about a new account. Everything else starts at its fixed value:
 * active, in no class, not a verified educator, no XP.
 */
export interface NewUserProfile {
  role: Role;
  schoolId: string | null;
  displayName: string;
  /** Username accounts only; then `email` is null. */
  username: string | null;
  email: string | null;
  ageBand: AgeBand;
  locale: Locale;
  consentBasis: ConsentBasis;
  provisionedByUid: string | null;
  /** Defaults to DEFAULT_AVATAR_ID. */
  avatarId?: string;
}

const NO_STATS: UserStats = {
  lessonsCompleted: 0,
  quizzesPassed: 0,
  projectsAccepted: 0,
  challengesCompleted: 0,
  coursesCompleted: 0,
  badges: 0,
  certificates: 0,
};

function assertRoleValue(role: Role): void {
  if (!ROLES.includes(role))
    throw new ValidationError('Unknown role.', { role: ['invalid_choice'] });
}

/** For auth/session and auth/claims only: no actor exists before the session is resolved. */
export async function loadProfileForSession(uid: string): Promise<UserProfile | null> {
  return readProfile(uid);
}

/**
 * The full profile: for the user, a school admin of their school and platform admins. A
 * teacher never gets it (services/classroom.getStudentForTeacher builds the reduced summary).
 */
export async function getUser(actor: Actor, uid: string): Promise<UserProfile> {
  const profile = await readProfile(uid);
  const allowed =
    profile !== null &&
    (isPlatformAdmin(actor) ||
      isActorUid(actor, uid) ||
      (hasRole(actor, 'school_admin') && inSchool(actor, profile.schoolId)));
  if (!allowed) throw new NotFoundError(`users/${uid} does not exist.`);
  return profile;
}

export async function listSchoolUsers(
  actor: Actor,
  schoolId: string,
  role: Role,
  page?: PageRequest,
): Promise<Page<UserProfile>> {
  assertCan(canManageSchool(actor, schoolId), 'school.users.list');
  assertId(schoolId);
  assertRoleValue(role);
  const query = collections
    .users()
    .where('schoolId', '==', schoolId)
    .where('role', '==', role)
    .orderBy('displayName');
  return readPage<UserProfile>(
    query,
    collections.users(),
    page,
    (data) => data.schoolId === schoolId && data.role === role,
  );
}

export async function listUsersByRole(
  actor: Actor,
  role: Role,
  page?: PageRequest,
): Promise<Page<UserProfile>> {
  assertCan(isPlatformAdmin(actor), 'users.list');
  assertRoleValue(role);
  const query = collections.users().where('role', '==', role).orderBy('createdAt', 'desc');
  return readPage<UserProfile>(query, collections.users(), page, (data) => data.role === role);
}

export async function createUserProfile(
  actor: Actor,
  uid: string,
  input: NewUserProfile,
): Promise<UserProfile> {
  assertSystem(actor);
  assertRoleValue(input.role);
  const avatarId = input.avatarId ?? DEFAULT_AVATAR_ID;
  if (!(AVATAR_IDS as readonly string[]).includes(avatarId)) {
    throw new ValidationError('Unknown avatar.', { avatarId: ['invalid_choice'] });
  }
  const ref = userDoc(uid);
  try {
    await ref.create({
      role: input.role,
      schoolId: input.schoolId,
      displayName: input.displayName,
      username: input.username,
      email: input.email,
      ageBand: input.ageBand,
      locale: input.locale,
      avatarId,
      status: 'active' satisfies UserStatus,
      classIds: [],
      consentBasis: input.consentBasis,
      provisionedByUid: input.provisionedByUid,
      verifiedEducator: false,
      sessionsValidAfter: null,
      xpTotal: 0,
      level: 1,
      stats: NO_STATS,
      lastLoginAt: null,
      ...createdNow(),
    });
  } catch (error) {
    if (isAlreadyExists(error)) throw new ConflictError(`users/${uid} already exists.`);
    throw error;
  }
  return fromSnapshot<UserProfile>(await ref.get());
}

/** A student's new display name is copied to their roster entry in every class they are in. */
export async function updateProfile(
  actor: Actor,
  uid: string,
  patch: ProfilePatch,
): Promise<UserProfile> {
  assertCan(isPlatformAdmin(actor) || isActorUid(actor, uid), 'profile.update');
  const parsed = parseInput(profilePatchSchema, patch);
  if (!parsed.success) throw new ValidationError('Invalid profile patch.', parsed.fieldErrors);
  const { displayName, locale, avatarId } = parsed.data;

  const ref = userDoc(uid);
  await getAdminDb().runTransaction(async (tx) => {
    const profile = fromSnapshot<UserProfile>(await tx.get(ref));
    const renamed = displayName !== undefined && displayName !== profile.displayName;
    const memberRefs =
      renamed && profile.role === 'student'
        ? profile.classIds.map((classId) => collections.classMembers(classId).doc(uid))
        : [];
    const members = memberRefs.length > 0 ? await tx.getAll(...memberRefs) : [];

    tx.update(ref, { displayName, locale, avatarId, ...updatedNow() });
    for (const member of members) {
      if (member.exists) tx.update(member.ref, { displayName, ...updatedNow() });
    }
  });
  return fromSnapshot<UserProfile>(await ref.get());
}

/**
 * The profile half of services/identity.applyIdentityChange, the only caller. A role can
 * change only once the user is in no class (provisioning.changeUserRole empties them first):
 * `classIds` means "member of" for a student and "teaches" for a teacher, so carrying it
 * across a role change would turn a pupil's classes into classes they teach.
 */
export async function setIdentity(
  actor: Actor,
  uid: string,
  patch: { role?: Role; schoolId?: string | null; status?: UserStatus },
): Promise<void> {
  assertSystem(actor);
  if (patch.role !== undefined) assertRoleValue(patch.role);
  const ref = userDoc(uid);
  await getAdminDb().runTransaction(async (tx) => {
    const profile = fromSnapshot<UserProfile>(await tx.get(ref));
    const roleChanges = patch.role !== undefined && patch.role !== profile.role;
    if (roleChanges && profile.classIds.length > 0) {
      throw new ConflictError(`users/${uid} is still in a class; the role cannot change.`);
    }
    tx.update(ref, {
      role: patch.role,
      schoolId: patch.schoolId,
      status: patch.status,
      // Only a teacher can be a verified educator.
      verifiedEducator: roleChanges && patch.role !== 'teacher' ? false : undefined,
      ...updatedNow(),
    });
  });
}

export async function setVerifiedEducator(
  actor: Actor,
  uid: string,
  verified: boolean,
): Promise<void> {
  assertCan(isPlatformAdmin(actor), 'user.verify_educator');
  const ref = userDoc(uid);
  await getAdminDb().runTransaction(async (tx) => {
    const profile = fromSnapshot<UserProfile>(await tx.get(ref));
    if (verified && profile.role !== 'teacher') {
      throw new ConflictError(`users/${uid} is not a teacher.`);
    }
    tx.update(ref, { verifiedEducator: verified, ...updatedNow() });
  });
}

/**
 * Stored in whole seconds, rounded down: a cookie's auth_time has no finer grain, and a
 * sign-in in the same second as the invalidation (the one right after a password reset) must
 * stay valid.
 */
export async function setSessionsValidAfter(actor: Actor, uid: string, at: Date): Promise<void> {
  assertSystem(actor);
  const seconds = Math.floor(at.getTime() / 1000);
  await updateExisting(userDoc(uid), {
    sessionsValidAfter: new Timestamp(seconds, 0),
    ...updatedNow(),
  });
}

export async function touchLastLogin(actor: Actor, uid: string): Promise<void> {
  assertSystem(actor);
  await updateExisting(userDoc(uid), { lastLoginAt: serverTimestamp(), ...updatedNow() });
}
