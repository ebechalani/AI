import 'server-only';
import type { CreateRequest, DecodedIdToken } from 'firebase-admin/auth';
import type { z } from 'zod';
import { studentAccountPolicy } from '@/lib/auth/account-policy';
import { isSystem, SYSTEM_ACTOR, type Actor, type Session } from '@/lib/auth/actor';
import {
  assertCan,
  canAssignRole,
  canManageClass,
  canManageSchool,
  canManageUser,
  canViewUser,
  isPlatformAdmin,
} from '@/lib/auth/authz';
import { syncClaims } from '@/lib/auth/claims';
import { safeNextPath } from '@/lib/auth/roles';
import { clearSessionCookie, setSessionCookie } from '@/lib/auth/session';
import { isUsernameAccountEmail, usernameToEmail } from '@/lib/auth/username';
import { writeAudit } from '@/lib/data/audit';
import { getClass, removeUserFromAllClasses } from '@/lib/data/classes';
import { consumeRateLimit } from '@/lib/data/rate-limit';
import { adjustSchoolCounts, createSchool, getSchool } from '@/lib/data/schools';
import {
  createUserProfile,
  getUser,
  setVerifiedEducator as writeVerifiedEducator,
  touchLastLogin,
  type NewUserProfile,
} from '@/lib/data/users';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  UnauthenticatedError,
  ValidationError,
} from '@/lib/errors';
import { getAdminAuth } from '@/lib/firebase/admin';
import { CONTENT_LIMITS, type RateLimitScope } from '@/lib/limits';
import { joinSignupInputSchema, signupInputSchema } from '@/lib/schemas/auth';
import { addStudentsInputSchema } from '@/lib/schemas/class';
import { FORM_ERROR_KEY, parseInput } from '@/lib/schemas/common';
import { createTeacherInputSchema, schoolInputSchema } from '@/lib/schemas/school';
import { ROLES, type AgeBand, type Locale, type Role } from '@/types/common';
import type { JoinSignupInput, SchoolInput, SignupInput } from '@/types/inputs';
import type { School, SchoolClass } from '@/types/school';
import { USER_STATUSES, type ConsentBasis, type UserProfile, type UserStatus } from '@/types/user';
import {
  addStudentToClass,
  resolveJoinCode,
  studentAccountContext,
  type JoinCodeTarget,
} from './classroom';
import { applyIdentityChange, countedIn, invalidateSessions } from './identity';
import { generatePassword, usernameBase, usernameCandidate } from './internal-credentials';

// Sessions and accounts (ARCHITECTURE.md 1.5, 10.3). Every account is an Auth user plus a
// profile written once with create(); role, school and status change only through
// services/identity.

/** A sign-in older than this cannot start a session: the ID token must come from a fresh login. */
const MAX_SIGN_IN_AGE_MS = 5 * 60 * 1000;
/** Candidates tried for a generated username before giving up. */
const USERNAME_ATTEMPTS = 8;

function requireSessionActor(actor: Actor, what: string): Session {
  if (isSystem(actor)) throw new ForbiddenError(what);
  return actor;
}

function authErrorCode(error: unknown): string | null {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
    ? error.code
    : null;
}

async function consume(scope: RateLimitScope, key: string): Promise<void> {
  const limit = await consumeRateLimit(scope, key);
  if (!limit.allowed) throw new RateLimitError(limit.retryAfterSeconds);
}

function parsed<T>(schema: z.ZodType<T>, input: unknown, what: string): T {
  const result = parseInput(schema, input);
  if (!result.success) throw new ValidationError(what, result.fieldErrors);
  return result.data;
}

function stringClaim(decoded: DecodedIdToken, name: string): string | null {
  const value: unknown = decoded[name];
  return typeof value === 'string' ? value : null;
}

// What verifyIdToken answers for a token that is malformed, expired or revoked, or whose
// account is gone or disabled; any other failure is a server fault and is thrown as it is.
const REFUSED_TOKEN_CODES = new Set([
  'auth/argument-error',
  'auth/id-token-expired',
  'auth/id-token-revoked',
  'auth/user-not-found',
]);

async function verifyIdToken(idToken: string, checkRevoked: boolean): Promise<DecodedIdToken> {
  try {
    return await getAdminAuth().verifyIdToken(idToken, checkRevoked);
  } catch (error) {
    const code = authErrorCode(error);
    if (code === 'auth/user-disabled') throw new ForbiddenError('The account is disabled.');
    if (code !== null && REFUSED_TOKEN_CODES.has(code)) {
      throw new UnauthenticatedError('The ID token was refused.');
    }
    throw error;
  }
}

// --- Sessions -----------------------------------------------------------------------------------

/**
 * Exchanges the ID token of a sign-in made in the last five minutes for the session cookie
 * (section 1.5). The profile decides the role; the claims are refreshed when they lag behind.
 */
export async function establishSession(
  idToken: string,
  next: string | null,
): Promise<{ redirectTo: string }> {
  const decoded = await verifyIdToken(idToken, true);
  const signedInAt = decoded.auth_time * 1000;
  if (Date.now() - signedInAt > MAX_SIGN_IN_AGE_MS) {
    throw new UnauthenticatedError('The sign-in is too old to start a session.');
  }

  let profile: UserProfile;
  try {
    profile = await getUser(SYSTEM_ACTOR, decoded.uid);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new AppError('profile_missing', `users/${decoded.uid} does not exist.`);
    }
    throw error;
  }
  if (profile.status !== 'active') throw new ForbiddenError('The account is disabled.');
  if (!isUsernameAccountEmail(decoded.email) && decoded.email_verified !== true) {
    throw new AppError('email_unverified', 'The email address is not verified.');
  }
  if (profile.sessionsValidAfter !== null && signedInAt < Date.parse(profile.sessionsValidAfter)) {
    throw new UnauthenticatedError('The sign-in predates the last session invalidation.');
  }

  if (
    stringClaim(decoded, 'role') !== profile.role ||
    stringClaim(decoded, 'schoolId') !== profile.schoolId
  ) {
    await syncClaims(profile.id);
  }
  await touchLastLogin(SYSTEM_ACTOR, profile.id);
  await setSessionCookie(idToken, profile.role);
  return { redirectTo: safeNextPath(next, profile.role) };
}

/** Ends the user's sessions on every device, then drops this one's cookie. */
export async function endSession(actor: Actor): Promise<void> {
  const session = requireSessionActor(actor, 'session.end');
  await invalidateSessions(session.uid);
  await clearSessionCookie();
}

/** For ensureClientAuth(): a custom token for the session's own uid, before a Storage upload. */
export async function issueClientAuthToken(actor: Actor): Promise<{ customToken: string }> {
  const session = requireSessionActor(actor, 'session.client_token');
  return { customToken: await getAdminAuth().createCustomToken(session.uid) };
}

// --- Account creation ---------------------------------------------------------------------------

/** Counts a new profile in its school and writes its claims. */
async function countAndClaim(profile: UserProfile): Promise<UserProfile> {
  const counted = countedIn(profile);
  if (counted !== null) {
    await adjustSchoolCounts(SYSTEM_ACTOR, counted.schoolId, { [counted.counter]: 1 });
  }
  await syncClaims(profile.id);
  return profile;
}

/** The profile of an Auth user, counted in its school, with its claims written. */
async function writeProfile(uid: string, input: NewUserProfile): Promise<UserProfile> {
  return countAndClaim(await createUserProfile(SYSTEM_ACTOR, uid, input));
}

/** The uid of the new Auth user, or null when the address already has an account. */
async function createAuthUser(request: CreateRequest): Promise<string | null> {
  try {
    return (await getAdminAuth().createUser(request)).uid;
  } catch (error) {
    if (authErrorCode(error) === 'auth/email-already-exists') return null;
    throw error;
  }
}

/**
 * The profile of an Auth user this service has just created. A profile that cannot be written
 * takes that Auth user down with it, so no account is left that could sign in without one.
 * Once the profile exists the account stands: a counter or claim that fails afterwards is
 * repaired later, not undone. (completeSignup never comes here: its Auth user belongs to the
 * person who signed up.)
 */
async function writeProfileOrDeleteAuthUser(
  uid: string,
  input: NewUserProfile,
): Promise<UserProfile> {
  let profile: UserProfile;
  try {
    profile = await createUserProfile(SYSTEM_ACTOR, uid, input);
  } catch (error) {
    await getAdminAuth()
      .deleteUser(uid)
      .catch(() => undefined);
    throw error;
  }
  return countAndClaim(profile);
}

/** Auth user plus profile; `emailTaken` is thrown when the address already has an account. */
async function createAccount(
  request: CreateRequest,
  input: NewUserProfile,
  emailTaken: () => AppError,
): Promise<UserProfile> {
  const uid = await createAuthUser(request);
  if (uid === null) throw emailTaken();
  return writeProfileOrDeleteAuthUser(uid, input);
}

async function authUserExists(email: string): Promise<boolean> {
  try {
    await getAdminAuth().getUserByEmail(email);
    return true;
  } catch (error) {
    if (authErrorCode(error) === 'auth/user-not-found') return false;
    throw error;
  }
}

interface NewStudent {
  displayName: string;
  ageBand: AgeBand;
  locale: Locale;
  schoolId: string | null;
  consentBasis: ConsentBasis;
  provisionedByUid: string | null;
}

function studentProfile(student: NewStudent, username: string): NewUserProfile {
  return {
    role: 'student',
    schoolId: student.schoolId,
    displayName: student.displayName,
    username,
    email: null,
    ageBand: student.ageBand,
    locale: student.locale,
    consentBasis: student.consentBasis,
    provisionedByUid: student.provisionedByUid,
  };
}

/** A username account whose name is derived from the display name; collisions get digits. */
async function createGeneratedUsernameAccount(
  student: NewStudent,
  password: string,
): Promise<{ profile: UserProfile; username: string }> {
  const base = usernameBase(student.displayName);
  for (let attempt = 0; attempt < USERNAME_ATTEMPTS; attempt += 1) {
    const username = usernameCandidate(base, attempt);
    const uid = await createAuthUser({
      email: usernameToEmail(username),
      password,
      displayName: student.displayName,
    });
    if (uid === null) continue;
    const profile = await writeProfileOrDeleteAuthUser(uid, studentProfile(student, username));
    return { profile, username };
  }
  throw new ConflictError(`No free username was found for "${base}".`);
}

function assertClassHasRoom(cls: SchoolClass, count: number): void {
  if (cls.archived) throw new ConflictError(`classes/${cls.id} is archived.`);
  if (cls.studentCount + count > CONTENT_LIMITS.studentsPerClass) {
    throw new ConflictError(`classes/${cls.id} cannot take ${count} more students.`);
  }
}

/**
 * Self sign-up (section 1.5, path 1): the browser has created the Auth user; this writes the
 * profile once. Everything the server derives (consent basis, no school, no classes) is set
 * here, never taken from the input.
 */
export async function completeSignup(
  idToken: string,
  input: SignupInput,
  ctx: { clientKey: string },
): Promise<UserProfile> {
  const data = parsed(signupInputSchema, input, 'Invalid sign-up.');
  await consume('signup', ctx.clientKey);
  const decoded = await verifyIdToken(idToken, false);
  const email = decoded.email?.trim().toLowerCase() ?? null;
  if (email === null || isUsernameAccountEmail(email)) {
    throw new ForbiddenError('Self sign-up needs an email account.');
  }
  const consentBasis: ConsentBasis =
    data.role === 'teacher' || data.ageBand === 'adult' ? 'adult' : 'self_13_plus';
  return writeProfile(decoded.uid, {
    role: data.role,
    schoolId: null,
    displayName: data.displayName,
    username: null,
    email,
    ageBand: data.ageBand,
    locale: data.locale,
    consentBasis,
    provisionedByUid: null,
  });
}

/** Join with a class code, not signed in (section 1.5, path 2): a username account in that class. */
export async function signUpWithJoinCode(
  input: JoinSignupInput,
  ctx: { clientKey: string },
): Promise<{ username: string }> {
  const data = parsed(joinSignupInputSchema, input, 'Invalid sign-up.');
  await consume('join_signup', ctx.clientKey);
  const target = await resolveJoinCode(data.joinCode);
  const decision = studentAccountPolicy(
    target.cls,
    await studentAccountContext(target),
    data.ageBand,
  );
  if (!decision.allowed) {
    throw new ForbiddenError(`This class cannot create the account: ${decision.reason}.`);
  }
  assertClassHasRoom(target.cls, 1);

  const profile = await createAccount(
    {
      email: usernameToEmail(data.username),
      password: data.password,
      displayName: data.displayName,
    },
    studentProfile(
      {
        displayName: data.displayName,
        ageBand: data.ageBand,
        locale: data.locale,
        schoolId: target.cls.schoolId,
        consentBasis: decision.consentBasis,
        provisionedByUid: null,
      },
      data.username,
    ),
    () => new ValidationError('The username is taken.', { username: ['duplicate'] }),
  );
  await addStudentToClass(SYSTEM_ACTOR, target.cls.id, profile, null);
  return { username: data.username };
}

/**
 * Staff add students to a class (section 1.5, path 3). The account policy is applied to every
 * requested age band before anything is created, so the call succeeds or refuses as a whole;
 * the generated credentials are returned once and never stored in clear.
 */
export async function provisionStudents(
  actor: Actor,
  classId: string,
  students: { displayName: string; ageBand?: AgeBand }[],
): Promise<{ uid: string; displayName: string; username: string; password: string }[]> {
  const session = requireSessionActor(actor, 'class.students.add');
  const data = parsed(addStudentsInputSchema, { classId, students }, 'Invalid students.');
  const cls = await getClass(actor, classId);
  assertCan(canManageClass(actor, cls), 'class.manage');
  const school: School | null =
    cls.schoolId === null ? null : await getSchool(SYSTEM_ACTOR, cls.schoolId);
  const target: JoinCodeTarget = { cls, school };
  const policyContext = await studentAccountContext(target);

  const locale = school?.defaultLocale ?? session.locale;
  const requests: NewStudent[] = data.students.map((student) => {
    const ageBand = student.ageBand ?? cls.ageBand;
    const decision = studentAccountPolicy(cls, policyContext, ageBand);
    if (!decision.allowed) {
      throw new ForbiddenError(`This class cannot create the account: ${decision.reason}.`);
    }
    return {
      displayName: student.displayName,
      ageBand,
      locale,
      schoolId: cls.schoolId,
      consentBasis: decision.consentBasis,
      provisionedByUid: session.uid,
    };
  });
  assertClassHasRoom(cls, requests.length);

  const credentials: { uid: string; displayName: string; username: string; password: string }[] =
    [];
  for (const request of requests) {
    const password = generatePassword();
    const { profile, username } = await createGeneratedUsernameAccount(request, password);
    await addStudentToClass(SYSTEM_ACTOR, cls.id, profile, session.uid);
    credentials.push({ uid: profile.id, displayName: profile.displayName, username, password });
  }
  return credentials;
}

/**
 * A new generated password for a username account, shown once; every session of the student
 * ends. Email accounts recover through Firebase's own reset email.
 */
export async function resetStudentPassword(
  actor: Actor,
  studentUid: string,
): Promise<{ username: string; password: string }> {
  requireSessionActor(actor, 'user.password_reset');
  const target = await getUser(SYSTEM_ACTOR, studentUid);
  if (!canViewUser(actor, target)) throw new NotFoundError(`users/${studentUid} does not exist.`);
  assertCan(canManageUser(actor, target), 'user.manage');
  if (target.username === null) {
    throw new ForbiddenError('Only a username account gets a generated password.');
  }

  const password = generatePassword();
  await getAdminAuth().updateUser(studentUid, { password });
  await invalidateSessions(studentUid);
  await writeAudit(actor, {
    action: 'user.password_reset',
    targetType: 'user',
    targetId: studentUid,
    schoolId: target.schoolId,
  });
  return { username: target.username, password };
}

/**
 * Section 1.5, path 5. The Auth user gets no password: the caller's browser sends the reset
 * email. An existing account with that address is never adopted.
 */
export async function createTeacher(
  actor: Actor,
  input: { displayName: string; email: string; schoolId: string },
): Promise<UserProfile> {
  const session = requireSessionActor(actor, 'school.teachers.manage');
  assertCan(canManageSchool(actor, input.schoolId), 'school.manage');
  const data = parsed(
    createTeacherInputSchema,
    { displayName: input.displayName, email: input.email },
    'Invalid teacher.',
  );
  const school = await getSchool(actor, input.schoolId);
  return createAccount(
    { email: data.email, displayName: data.displayName },
    {
      role: 'teacher',
      schoolId: school.id,
      displayName: data.displayName,
      username: null,
      email: data.email,
      ageBand: 'adult',
      locale: school.defaultLocale,
      consentBasis: 'adult',
      provisionedByUid: session.uid,
    },
    () => new ConflictError('An account with this email already exists.'),
  );
}

/** Field errors of a nested or renamed input, keyed as the action's own input names them. */
function renamedFieldErrors(
  fieldErrors: Record<string, string[]>,
  rename: (field: string) => string,
): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([field, keys]) => [rename(field), keys]),
  );
}

const ADMIN_FIELD_NAMES: Record<string, string> = {
  displayName: 'adminDisplayName',
  email: 'adminEmail',
};

/** Section 1.5, path 6: a school and its first admin, who sets a password through the reset email. */
export async function createSchoolWithAdmin(
  actor: Actor,
  input: { school: SchoolInput; adminDisplayName: string; adminEmail: string },
): Promise<{ school: School; admin: UserProfile }> {
  const session = requireSessionActor(actor, 'school.create');
  assertCan(isPlatformAdmin(actor), 'school.create');
  const schoolResult = parseInput(schoolInputSchema, input.school);
  if (!schoolResult.success) {
    throw new ValidationError(
      'Invalid school.',
      renamedFieldErrors(schoolResult.fieldErrors, (field) =>
        field === FORM_ERROR_KEY ? 'school' : `school.${field}`,
      ),
    );
  }
  const adminResult = parseInput(createTeacherInputSchema, {
    displayName: input.adminDisplayName,
    email: input.adminEmail,
  });
  if (!adminResult.success) {
    throw new ValidationError(
      'Invalid school admin.',
      renamedFieldErrors(adminResult.fieldErrors, (field) =>
        Object.hasOwn(ADMIN_FIELD_NAMES, field) ? ADMIN_FIELD_NAMES[field]! : field,
      ),
    );
  }
  // Refused before the school is written: a school is never left without its admin.
  if (await authUserExists(adminResult.data.email)) {
    throw new ConflictError('An account with this email already exists.');
  }

  const school = await createSchool(actor, schoolResult.data);
  const admin = await createAccount(
    { email: adminResult.data.email, displayName: adminResult.data.displayName },
    {
      role: 'school_admin',
      schoolId: school.id,
      displayName: adminResult.data.displayName,
      username: null,
      email: adminResult.data.email,
      ageBand: 'adult',
      locale: school.defaultLocale,
      consentBasis: 'adult',
      provisionedByUid: session.uid,
    },
    () => new ConflictError('An account with this email already exists.'),
  );
  return { school, admin };
}

// --- Identity changes ---------------------------------------------------------------------------

/**
 * Moves a user to another role or school: out of every class first (ConflictError while they
 * own a class that is not archived), then the identity change with session invalidation.
 */
export async function changeUserRole(
  actor: Actor,
  uid: string,
  role: Role,
  schoolId: string | null,
): Promise<void> {
  if (!ROLES.includes(role)) {
    throw new ValidationError('Unknown role.', { role: ['invalid_choice'] });
  }
  if (role === 'school_admin' && schoolId === null) {
    throw new ValidationError('A school admin belongs to a school.', { schoolId: ['required'] });
  }
  if (role === 'platform_admin' && schoolId !== null) {
    throw new ValidationError('A platform admin has no school.', { schoolId: ['invalid'] });
  }
  const target = await getUser(SYSTEM_ACTOR, uid);
  if (!canViewUser(actor, target)) throw new NotFoundError(`users/${uid} does not exist.`);
  assertCan(canAssignRole(actor, target, role, schoolId), 'user.assign_role');
  if (schoolId !== null) await getSchool(SYSTEM_ACTOR, schoolId);
  if (target.role === role && target.schoolId === schoolId) return;

  await removeUserFromAllClasses(SYSTEM_ACTOR, uid);
  await applyIdentityChange(uid, { role, schoolId }, { invalidateSessions: true });
  await writeAudit(actor, {
    action: 'user.role_changed',
    targetType: 'user',
    targetId: uid,
    schoolId,
    meta: {
      role,
      previousRole: target.role,
      previousSchoolId: target.schoolId,
    },
  });
}

/**
 * Disables or re-enables an account: the profile (which every request checks), then the Auth
 * flag. A school actor cannot disable a self-registered student who merely joined one of the
 * school's classes (section 4.4); they remove the student from the class instead.
 */
export async function setUserStatus(actor: Actor, uid: string, status: UserStatus): Promise<void> {
  if (!USER_STATUSES.includes(status)) {
    throw new ValidationError('Unknown status.', { status: ['invalid_choice'] });
  }
  if (!isSystem(actor) && actor.uid === uid) {
    throw new ForbiddenError('Nobody changes the status of their own account.');
  }
  const target = await getUser(SYSTEM_ACTOR, uid);
  if (!canViewUser(actor, target)) throw new NotFoundError(`users/${uid} does not exist.`);
  assertCan(canManageUser(actor, target), 'user.manage');
  if (
    !isPlatformAdmin(actor) &&
    target.role === 'student' &&
    target.username === null &&
    status === 'disabled'
  ) {
    throw new ForbiddenError('A self-registered student is removed from the class, not disabled.');
  }
  if (target.status === status) return;

  await applyIdentityChange(uid, { status }, { invalidateSessions: status === 'disabled' });
  await getAdminAuth().updateUser(uid, { disabled: status === 'disabled' });
  await writeAudit(actor, {
    action: 'user.status_changed',
    targetType: 'user',
    targetId: uid,
    schoolId: target.schoolId,
    meta: { status, previousStatus: target.status },
  });
}

/** Platform admin only; the target must be a teacher (data/users refuses otherwise). */
export async function setVerifiedEducator(
  actor: Actor,
  uid: string,
  verified: boolean,
): Promise<void> {
  assertCan(isPlatformAdmin(actor), 'user.verify_educator');
  if (typeof verified !== 'boolean') {
    throw new ValidationError('Invalid flag.', { verified: ['invalid'] });
  }
  const target = await getUser(actor, uid);
  await writeVerifiedEducator(actor, uid, verified);
  await writeAudit(actor, {
    action: 'user.educator_verified',
    targetType: 'user',
    targetId: uid,
    schoolId: target.schoolId,
    meta: { verified },
  });
}
