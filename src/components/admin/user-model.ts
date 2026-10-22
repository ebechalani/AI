import { ROLES, type Role } from '@/types/common';
import type { SetUserRoleInput } from '@/types/inputs';
import type { UserProfile } from '@/types/user';

// The users page and the school's people tab as pure functions: the role tabs, the rules of a
// role change and what it does, the row controls each account gets, shared with the tests.

export const ROLE_TABS: readonly Role[] = ['teacher', 'student', 'school_admin', 'platform_admin'];
export const DEFAULT_ROLE: Role = 'teacher';
export const PEOPLE_TABS: readonly Role[] = ['school_admin', 'teacher', 'student'];
export const DEFAULT_PEOPLE_ROLE: Role = 'school_admin';

/** `raw` when it is one of `allowed`, else `fallback`. */
export function parseRole(raw: string | undefined, allowed: readonly Role[], fallback: Role): Role {
  return raw !== undefined && (allowed as readonly string[]).includes(raw) ? (raw as Role) : fallback;
}

export type SchoolRule = 'required' | 'optional' | 'none';

/** school_admin → 'required'; platform_admin → 'none'; student, teacher → 'optional'. */
export function schoolRule(role: Role): SchoolRule {
  if (role === 'school_admin') return 'required';
  if (role === 'platform_admin') return 'none';
  return 'optional';
}

export interface RoleChoice {
  role: Role;
  schoolId: string | null;
}

/** The dialog's starting point: the user's role and school. */
export function initialRoleChoice(user: Pick<UserProfile, 'role' | 'schoolId'>): RoleChoice {
  return { role: user.role, schoolId: user.schoolId };
}

/**
 * UI guard (SPEC-H 12.2.12; the services allow any role): the staff roles (teacher,
 * school_admin, platform_admin) are offered only to an adult account that signs in with an
 * email. A pupil's username account or a minor's account is never promoted to staff from this
 * screen. The user's current role is always offered.
 */
export function staffRolesAllowed(user: Pick<UserProfile, 'ageBand' | 'email'>): boolean {
  return user.ageBand === 'adult' && user.email !== null;
}

/** ROLES in order, each with `disabled` = a staff role while !staffRolesAllowed(user) and not the current role. */
export function roleOptions(
  user: Pick<UserProfile, 'role' | 'ageBand' | 'email'>,
): { role: Role; disabled: boolean }[] {
  const staffAllowed = staffRolesAllowed(user);
  return ROLES.map((role) => ({
    role,
    disabled: role !== 'student' && role !== user.role && !staffAllowed,
  }));
}

/** The action input: schoolId forced to null for platform_admin. */
export function roleChangePayload(uid: string, choice: RoleChoice): SetUserRoleInput {
  return {
    uid,
    role: choice.role,
    schoolId: choice.role === 'platform_admin' ? null : choice.schoolId,
  };
}

/** Same role and same school (after the platform_admin rule): changeUserRole would do nothing. */
export function isRoleUnchanged(
  user: Pick<UserProfile, 'role' | 'schoolId'>,
  choice: RoleChoice,
): boolean {
  const schoolId = choice.role === 'platform_admin' ? null : choice.schoolId;
  return user.role === choice.role && user.schoolId === schoolId;
}

export type RoleEffect =
  | 'signOut'
  | 'leaveClasses'
  | 'loseVerification'
  | 'fullAccess'
  | 'schoolAdmin'
  | 'leaveSchool'
  | 'joinSchool';

/** What changeUserRole will do, in this order; [] when unchanged. */
export function roleChangeEffects(
  user: Pick<UserProfile, 'role' | 'schoolId' | 'classIds' | 'verifiedEducator'>,
  choice: RoleChoice,
): RoleEffect[] {
  if (isRoleUnchanged(user, choice)) return [];
  const schoolId = choice.role === 'platform_admin' ? null : choice.schoolId;
  const effects: RoleEffect[] = ['signOut'];
  if (user.classIds.length > 0) effects.push('leaveClasses');
  if (user.verifiedEducator && choice.role !== 'teacher') effects.push('loseVerification');
  if (choice.role === 'platform_admin') effects.push('fullAccess');
  if (choice.role === 'school_admin') effects.push('schoolAdmin');
  if (user.schoolId !== null && schoolId === null) effects.push('leaveSchool');
  if (schoolId !== null && schoolId !== user.schoolId && choice.role !== 'school_admin') {
    effects.push('joinSchool');
  }
  return effects;
}

export interface UserRowPermissions {
  /** The viewer's own row: no control at all (guard rail). */
  self: boolean;
  changeRole: boolean;
  status: 'disable' | 'enable' | null;
  /** Teachers only (not self): verified → 'unverify', else 'verify'. */
  verify: 'verify' | 'unverify' | null;
}

export function userRowPermissions(
  user: Pick<UserProfile, 'id' | 'role' | 'status' | 'verifiedEducator'>,
  viewerUid: string,
): UserRowPermissions {
  const self = user.id === viewerUid;
  if (self) return { self, changeRole: false, status: null, verify: null };
  return {
    self,
    changeRole: true,
    status: user.status === 'active' ? 'disable' : 'enable',
    verify: user.role === 'teacher' ? (user.verifiedEducator ? 'unverify' : 'verify') : null,
  };
}

/** What the user signs in with: the email, else the username, else nothing. */
export function signInIdentifier(user: Pick<UserProfile, 'email' | 'username'>): {
  kind: 'email' | 'username' | 'none';
  value: string | null;
} {
  if (user.email !== null) return { kind: 'email', value: user.email };
  if (user.username !== null) return { kind: 'username', value: user.username };
  return { kind: 'none', value: null };
}

/** Students and teachers take courses and can own subscriptions: they get the two links. */
export function hasLearnerLinks(role: Role): boolean {
  return role === 'student' || role === 'teacher';
}

/** The reduced shape the client row controls receive. */
export type UserRowData = Pick<
  UserProfile,
  'id' | 'displayName' | 'role' | 'schoolId' | 'status' | 'verifiedEducator' | 'classIds' | 'ageBand' | 'email'
>;

export function toUserRow(user: UserProfile): UserRowData {
  return {
    id: user.id,
    displayName: user.displayName,
    role: user.role,
    schoolId: user.schoolId,
    status: user.status,
    verifiedEducator: user.verifiedEducator,
    classIds: user.classIds,
    ageBand: user.ageBand,
    email: user.email,
  };
}
