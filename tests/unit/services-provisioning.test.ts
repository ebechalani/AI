import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SYSTEM_ACTOR } from '@/lib/auth/actor';
import { syncClaims } from '@/lib/auth/claims';
import { clearSessionCookie, setSessionCookie } from '@/lib/auth/session';
import { STUDENT_EMAIL_DOMAIN } from '@/lib/auth/username';
import { writeAudit } from '@/lib/data/audit';
import { getClass, removeUserFromAllClasses } from '@/lib/data/classes';
import { consumeRateLimit } from '@/lib/data/rate-limit';
import { adjustSchoolCounts, createSchool, deleteNewSchool, getSchool } from '@/lib/data/schools';
import {
  createUserProfile,
  getUser,
  setVerifiedEducator as writeVerifiedEducator,
  touchLastLogin,
} from '@/lib/data/users';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  UnauthenticatedError,
  ValidationError,
} from '@/lib/errors';
import { getAdminAuth } from '@/lib/firebase/admin';
import {
  addStudentToClass,
  resolveJoinCode,
  studentAccountContext,
} from '@/lib/services/classroom';
import { applyIdentityChange, invalidateSessions } from '@/lib/services/identity';
import {
  changeUserRole,
  completeSignup,
  createSchoolWithAdmin,
  createTeacher,
  endSession,
  establishSession,
  issueClientAuthToken,
  provisionStudents,
  resetStudentPassword,
  setUserStatus,
  setVerifiedEducator,
  signUpWithJoinCode,
} from '@/lib/services/provisioning';
import type { JoinSignupInput, Role, School, SchoolClass, Session, UserProfile } from '@/types';

// services/provisioning with Firebase Auth, the cookie and the repositories replaced: the
// decisions of section 1.5 (who gets a session, which accounts can be created where, what a
// role or status change does) and the order of the writes. The real Auth and Firestore paths
// run in tests/integration.

vi.mock('@/lib/firebase/admin', () => ({
  getAdminAuth: vi.fn(),
  getAdminDb: vi.fn(() => {
    throw new Error('Firestore was reached.');
  }),
}));
vi.mock('@/lib/auth/session', () => ({ setSessionCookie: vi.fn(), clearSessionCookie: vi.fn() }));
vi.mock('@/lib/auth/claims', () => ({ syncClaims: vi.fn() }));
vi.mock('@/lib/data/audit', () => ({ writeAudit: vi.fn() }));
vi.mock('@/lib/data/classes', () => ({ getClass: vi.fn(), removeUserFromAllClasses: vi.fn() }));
vi.mock('@/lib/data/rate-limit', () => ({ consumeRateLimit: vi.fn() }));
vi.mock('@/lib/data/schools', () => ({
  adjustSchoolCounts: vi.fn(),
  createSchool: vi.fn(),
  deleteNewSchool: vi.fn(),
  getSchool: vi.fn(),
}));
vi.mock('@/lib/data/users', () => ({
  createUserProfile: vi.fn(),
  getUser: vi.fn(),
  setVerifiedEducator: vi.fn(),
  touchLastLogin: vi.fn(),
}));
vi.mock('@/lib/services/classroom', () => ({
  addStudentToClass: vi.fn(),
  resolveJoinCode: vi.fn(),
  studentAccountContext: vi.fn(),
}));
vi.mock('@/lib/services/identity', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/services/identity')>()),
  applyIdentityChange: vi.fn(),
  invalidateSessions: vi.fn(),
}));

const NOW = '2026-10-02T08:00:00.000Z';
const CLIENT = { clientKey: 'b'.repeat(64) };
const PASSWORD_PATTERN = /^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/;

const auth = {
  verifyIdToken: vi.fn(),
  createCustomToken: vi.fn(),
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  getUserByEmail: vi.fn(),
  updateUser: vi.fn(),
};

function session(
  role: Role,
  uid: string,
  schoolId: string | null = null,
  classIds: string[] = [],
): Session {
  return {
    uid,
    role,
    schoolId,
    classIds,
    displayName: uid,
    locale: 'en',
    ageBand: 'adult',
    avatarId: 'robot',
    verifiedEducator: false,
  };
}

function profile(fields: Partial<UserProfile> & { id: string }): UserProfile {
  return {
    role: 'student',
    schoolId: null,
    displayName: fields.id,
    username: null,
    email: `${fields.id}@example.com`,
    ageBand: '11-12',
    locale: 'en',
    avatarId: 'robot',
    status: 'active',
    classIds: [],
    consentBasis: 'self_13_plus',
    provisionedByUid: null,
    verifiedEducator: false,
    sessionsValidAfter: null,
    xpTotal: 0,
    level: 1,
    stats: {
      lessonsCompleted: 0,
      quizzesPassed: 0,
      projectsAccepted: 0,
      challengesCompleted: 0,
      coursesCompleted: 0,
      badges: 0,
      certificates: 0,
    },
    lastLoginAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

function schoolClass(fields: Partial<SchoolClass> & { id: string }): SchoolClass {
  return {
    schoolId: 'school-a',
    name: `Class ${fields.id}`,
    gradeLabel: null,
    ageBand: '11-12',
    ownerUid: 'teacher-1',
    teacherUids: ['teacher-1'],
    joinCode: 'RBHDEM23',
    joinCodeEnabled: true,
    joinCodeExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    studentCount: 0,
    assignedCourseIds: [],
    archived: false,
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

function school(fields: Partial<School> & { id: string }): School {
  return {
    name: 'Demo Academy',
    country: 'LB',
    city: null,
    defaultLocale: 'fr',
    status: 'active',
    settings: { aiEnabled: true, aiDailyMessageLimit: null, joinCodesEnabled: true },
    counts: { teachers: 1, students: 0, classes: 1 },
    createdByUid: 'root',
    createdAt: NOW,
    updatedAt: NOW,
    ...fields,
  };
}

interface TokenFields {
  uid?: string;
  ageMs?: number;
  email?: string | null;
  emailVerified?: boolean;
  role?: string;
  schoolId?: string | null;
}

function token(fields: TokenFields = {}) {
  const email = fields.email === undefined ? 'teacher-1@example.com' : fields.email;
  return {
    uid: fields.uid ?? 'teacher-1',
    auth_time: Math.floor((Date.now() - (fields.ageMs ?? 1_000)) / 1000),
    ...(email === null ? {} : { email }),
    email_verified: fields.emailVerified ?? true,
    ...(fields.role === undefined ? {} : { role: fields.role }),
    ...(fields.schoolId === undefined ? {} : { schoolId: fields.schoolId }),
  };
}

const teacher = session('teacher', 'teacher-1', 'school-a', ['class-a']);
const schoolAdmin = session('school_admin', 'admin-a', 'school-a');
const platformAdmin = session('platform_admin', 'root');

let users: Map<string, UserProfile>;
let takenEmails: Set<string>;
let nextUid: number;
let rateLimited: boolean;

beforeEach(() => {
  vi.clearAllMocks();
  users = new Map();
  takenEmails = new Set();
  nextUid = 1;
  rateLimited = false;
  vi.mocked(getAdminAuth).mockReturnValue(auth as unknown as ReturnType<typeof getAdminAuth>);
  auth.createUser.mockImplementation(async (request: { email: string }) => {
    if (takenEmails.has(request.email)) {
      throw Object.assign(new Error('taken'), { code: 'auth/email-already-exists' });
    }
    takenEmails.add(request.email);
    return { uid: `uid-${nextUid++}` };
  });
  auth.getUserByEmail.mockImplementation(async (email: string) => {
    if (takenEmails.has(email)) return { uid: 'existing' };
    throw Object.assign(new Error('none'), { code: 'auth/user-not-found' });
  });
  auth.deleteUser.mockResolvedValue(undefined);
  auth.updateUser.mockResolvedValue({});
  auth.createCustomToken.mockResolvedValue('custom-token');
  vi.mocked(consumeRateLimit).mockImplementation(async () =>
    rateLimited
      ? { allowed: false, retryAfterSeconds: 300 }
      : { allowed: true, retryAfterSeconds: null },
  );
  vi.mocked(getUser).mockImplementation(async (_actor, uid) => {
    const found = users.get(uid);
    if (found === undefined) throw new NotFoundError(`users/${uid}`);
    return found;
  });
  vi.mocked(createUserProfile).mockImplementation(async (_actor, uid, input) => {
    if (users.has(uid)) throw new ConflictError(`users/${uid} exists`);
    const created = profile({ id: uid, ...input, avatarId: input.avatarId ?? 'robot' });
    users.set(uid, created);
    return created;
  });
  vi.mocked(getSchool).mockImplementation(async (_actor, schoolId) => {
    if (schoolId !== 'school-a') throw new NotFoundError(`schools/${schoolId}`);
    return school({ id: 'school-a' });
  });
  vi.mocked(createSchool).mockImplementation(async (_actor, input) =>
    school({ id: 'school-new', ...input }),
  );
  vi.mocked(deleteNewSchool).mockResolvedValue(undefined);
  vi.mocked(getClass).mockImplementation(async () => schoolClass({ id: 'class-a' }));
  vi.mocked(studentAccountContext).mockResolvedValue({
    schoolActive: true,
    ownerVerifiedEducator: false,
  });
  vi.mocked(resolveJoinCode).mockResolvedValue({
    cls: schoolClass({ id: 'class-a' }),
    school: school({ id: 'school-a' }),
  });
});

// --- Sessions -------------------------------------------------------------------------------------

describe('establishSession', () => {
  beforeEach(() => {
    users.set('teacher-1', profile({ id: 'teacher-1', role: 'teacher', schoolId: 'school-a' }));
    auth.verifyIdToken.mockResolvedValue(token({ role: 'teacher', schoolId: 'school-a' }));
  });

  it('checks the token with revocation and refuses a dead, stale or disabled one', async () => {
    for (const code of [
      'auth/argument-error',
      'auth/id-token-expired',
      'auth/id-token-revoked',
      'auth/user-not-found',
    ]) {
      auth.verifyIdToken.mockRejectedValueOnce(Object.assign(new Error(code), { code }));
      await expect(establishSession('t', null)).rejects.toBeInstanceOf(UnauthenticatedError);
    }
    auth.verifyIdToken.mockRejectedValueOnce(
      Object.assign(new Error('disabled'), { code: 'auth/user-disabled' }),
    );
    await expect(establishSession('t', null)).rejects.toBeInstanceOf(ForbiddenError);
    auth.verifyIdToken.mockRejectedValueOnce(new Error('emulator down'));
    await expect(establishSession('t', null)).rejects.toThrow('emulator down');

    auth.verifyIdToken.mockResolvedValueOnce(token({ ageMs: 6 * 60 * 1000 }));
    await expect(establishSession('t', null)).rejects.toBeInstanceOf(UnauthenticatedError);
    expect(auth.verifyIdToken).toHaveBeenCalledWith('t', true);
    expect(setSessionCookie).not.toHaveBeenCalled();
  });

  it('needs an active profile and, for an email account, a verified address', async () => {
    users.delete('teacher-1');
    await expect(establishSession('t', null)).rejects.toMatchObject({ code: 'profile_missing' });

    users.set(
      'teacher-1',
      profile({ id: 'teacher-1', role: 'teacher', schoolId: 'school-a', status: 'disabled' }),
    );
    await expect(establishSession('t', null)).rejects.toBeInstanceOf(ForbiddenError);

    users.set('teacher-1', profile({ id: 'teacher-1', role: 'teacher', schoolId: 'school-a' }));
    auth.verifyIdToken.mockResolvedValueOnce(token({ emailVerified: false }));
    await expect(establishSession('t', null)).rejects.toMatchObject({ code: 'email_unverified' });
    expect(setSessionCookie).not.toHaveBeenCalled();
  });

  it('lets a username account in without a verified address', async () => {
    users.set('lea', profile({ id: 'lea', username: 'lea.m', email: null, schoolId: 'school-a' }));
    auth.verifyIdToken.mockResolvedValue(
      token({ uid: 'lea', email: `lea.m@${STUDENT_EMAIL_DOMAIN}`, emailVerified: false }),
    );
    expect(await establishSession('t', '/student/learn')).toEqual({
      redirectTo: '/student/learn',
    });
    expect(setSessionCookie).toHaveBeenCalledWith('t', 'student');
  });

  it('refuses a sign-in older than the last invalidation', async () => {
    users.set(
      'teacher-1',
      profile({
        id: 'teacher-1',
        role: 'teacher',
        schoolId: 'school-a',
        sessionsValidAfter: new Date(Date.now() + 60_000).toISOString(),
      }),
    );
    await expect(establishSession('t', null)).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('refreshes the claims only when they lag behind the profile, then records the login and sets the cookie', async () => {
    expect(await establishSession('t', '/admin/schools')).toEqual({ redirectTo: '/teacher' });
    expect(syncClaims).not.toHaveBeenCalled();
    expect(touchLastLogin).toHaveBeenCalledWith(SYSTEM_ACTOR, 'teacher-1');
    expect(setSessionCookie).toHaveBeenCalledWith('t', 'teacher');

    auth.verifyIdToken.mockResolvedValueOnce(token({ role: 'student', schoolId: 'school-a' }));
    await establishSession('t', null);
    auth.verifyIdToken.mockResolvedValueOnce(token({ role: 'teacher' }));
    await establishSession('t', null);
    expect(syncClaims).toHaveBeenCalledTimes(2);
    expect(syncClaims).toHaveBeenCalledWith('teacher-1');
  });
});

describe('endSession and issueClientAuthToken', () => {
  it('end every session, then drop the cookie; neither works for the system', async () => {
    await endSession(teacher);
    expect(invalidateSessions).toHaveBeenCalledWith('teacher-1');
    expect(clearSessionCookie).toHaveBeenCalledTimes(1);
    expect(vi.mocked(invalidateSessions).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(clearSessionCookie).mock.invocationCallOrder[0]!,
    );
    expect(await issueClientAuthToken(teacher)).toEqual({ customToken: 'custom-token' });
    expect(auth.createCustomToken).toHaveBeenCalledWith('teacher-1');
    await expect(endSession(SYSTEM_ACTOR)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(issueClientAuthToken(SYSTEM_ACTOR)).rejects.toBeInstanceOf(ForbiddenError);
  });
});

// --- Account creation -----------------------------------------------------------------------------

describe('completeSignup', () => {
  const input = {
    displayName: 'Nour K',
    role: 'student' as const,
    ageBand: '13-15' as const,
    locale: 'fr' as const,
    acceptedTerms: true as const,
  };

  beforeEach(() => {
    auth.verifyIdToken.mockResolvedValue(
      token({ uid: 'new-1', email: 'Nour.K@Example.com', emailVerified: false }),
    );
  });

  it('validates before counting, counts before verifying', async () => {
    await expect(completeSignup('t', { ...input, ageBand: '8-10' }, CLIENT)).rejects.toMatchObject({
      code: 'validation',
      fieldErrors: { ageBand: ['age_band_not_allowed'] },
    });
    expect(consumeRateLimit).not.toHaveBeenCalled();
    rateLimited = true;
    await expect(completeSignup('t', input, CLIENT)).rejects.toBeInstanceOf(RateLimitError);
    expect(consumeRateLimit).toHaveBeenCalledWith('signup', CLIENT.clientKey);
    expect(auth.verifyIdToken).not.toHaveBeenCalled();
  });

  it('refuses a token without an email account', async () => {
    auth.verifyIdToken.mockResolvedValueOnce(
      token({ uid: 'new-1', email: `nour@${STUDENT_EMAIL_DOMAIN}` }),
    );
    await expect(completeSignup('t', input, CLIENT)).rejects.toBeInstanceOf(ForbiddenError);
    auth.verifyIdToken.mockResolvedValueOnce(token({ uid: 'new-1', email: null }));
    await expect(completeSignup('t', input, CLIENT)).rejects.toBeInstanceOf(ForbiddenError);
    expect(createUserProfile).not.toHaveBeenCalled();
  });

  it('writes the profile once with what the server derives, and never deletes the Auth user', async () => {
    const created = await completeSignup('t', input, CLIENT);
    expect(created.id).toBe('new-1');
    expect(createUserProfile).toHaveBeenCalledWith(SYSTEM_ACTOR, 'new-1', {
      role: 'student',
      schoolId: null,
      displayName: 'Nour K',
      username: null,
      email: 'nour.k@example.com',
      ageBand: '13-15',
      locale: 'fr',
      consentBasis: 'self_13_plus',
      provisionedByUid: null,
    });
    expect(syncClaims).toHaveBeenCalledWith('new-1');
    expect(adjustSchoolCounts).not.toHaveBeenCalled();
    expect(auth.verifyIdToken).toHaveBeenCalledWith('t', false);

    await expect(completeSignup('t', input, CLIENT)).rejects.toBeInstanceOf(ConflictError);
    expect(auth.deleteUser).not.toHaveBeenCalled();
  });

  it('derives consentBasis adult for teachers and adult students', async () => {
    await completeSignup('t', { ...input, ageBand: 'adult' }, CLIENT);
    expect(createUserProfile).toHaveBeenLastCalledWith(
      SYSTEM_ACTOR,
      'new-1',
      expect.objectContaining({ consentBasis: 'adult' }),
    );
    users.clear();
    await completeSignup('t', { ...input, role: 'teacher', ageBand: 'adult' }, CLIENT);
    expect(createUserProfile).toHaveBeenLastCalledWith(
      SYSTEM_ACTOR,
      'new-1',
      expect.objectContaining({ role: 'teacher', consentBasis: 'adult', schoolId: null }),
    );
  });
});

describe('signUpWithJoinCode', () => {
  const input: JoinSignupInput = {
    joinCode: 'RBHDEM23',
    displayName: 'Omar S',
    username: 'Omar.S',
    password: 'correct-horse-7',
    ageBand: '8-10',
    locale: 'fr',
    acceptedTerms: true,
  };

  it('counts the request, then applies the account policy before creating anything', async () => {
    rateLimited = true;
    await expect(signUpWithJoinCode(input, CLIENT)).rejects.toBeInstanceOf(RateLimitError);
    expect(consumeRateLimit).toHaveBeenCalledWith('join_signup', CLIENT.clientKey);
    rateLimited = false;
    vi.mocked(studentAccountContext).mockResolvedValue({
      schoolActive: false,
      ownerVerifiedEducator: true,
    });
    vi.mocked(resolveJoinCode).mockResolvedValue({
      cls: schoolClass({ id: 'class-solo', schoolId: null }),
      school: null,
    });
    await expect(signUpWithJoinCode(input, CLIENT)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(signUpWithJoinCode({ ...input, ageBand: '13-15' }, CLIENT)).resolves.toEqual({
      username: 'omar.s',
    });
    expect(createUserProfile).toHaveBeenCalledWith(
      SYSTEM_ACTOR,
      'uid-1',
      expect.objectContaining({ schoolId: null, consentBasis: 'self_13_plus' }),
    );
  });

  it('refuses a full or archived class and a taken username as form errors', async () => {
    vi.mocked(resolveJoinCode).mockResolvedValue({
      cls: schoolClass({ id: 'class-a', studentCount: 60 }),
      school: school({ id: 'school-a' }),
    });
    await expect(signUpWithJoinCode(input, CLIENT)).rejects.toBeInstanceOf(ConflictError);
    vi.mocked(resolveJoinCode).mockResolvedValue({
      cls: schoolClass({ id: 'class-a' }),
      school: school({ id: 'school-a' }),
    });
    takenEmails.add(`omar.s@${STUDENT_EMAIL_DOMAIN}`);
    await expect(signUpWithJoinCode(input, CLIENT)).rejects.toMatchObject({
      code: 'validation',
      fieldErrors: { username: ['duplicate'] },
    });
    expect(createUserProfile).not.toHaveBeenCalled();
  });

  it('creates the Auth user and the profile in the class’s school, counts the seat and adds the member', async () => {
    expect(await signUpWithJoinCode(input, CLIENT)).toEqual({ username: 'omar.s' });
    expect(auth.createUser).toHaveBeenCalledWith({
      email: `omar.s@${STUDENT_EMAIL_DOMAIN}`,
      password: 'correct-horse-7',
      displayName: 'Omar S',
    });
    expect(createUserProfile).toHaveBeenCalledWith(SYSTEM_ACTOR, 'uid-1', {
      role: 'student',
      schoolId: 'school-a',
      displayName: 'Omar S',
      username: 'omar.s',
      email: null,
      ageBand: '8-10',
      locale: 'fr',
      consentBasis: 'school',
      provisionedByUid: null,
    });
    expect(adjustSchoolCounts).toHaveBeenCalledWith(SYSTEM_ACTOR, 'school-a', { students: 1 });
    expect(syncClaims).toHaveBeenCalledWith('uid-1');
    expect(addStudentToClass).toHaveBeenCalledWith(
      SYSTEM_ACTOR,
      'class-a',
      expect.objectContaining({ id: 'uid-1' }),
      null,
    );
  });

  it('removes the Auth user again when the profile cannot be written', async () => {
    vi.mocked(createUserProfile).mockRejectedValueOnce(new Error('firestore down'));
    await expect(signUpWithJoinCode(input, CLIENT)).rejects.toThrow('firestore down');
    expect(auth.deleteUser).toHaveBeenCalledWith('uid-1');
    expect(addStudentToClass).not.toHaveBeenCalled();
  });
});

describe('provisionStudents', () => {
  const students = [
    { displayName: 'Léa Martin' },
    { displayName: 'Léa Martin', ageBand: '8-10' as const },
  ];

  it('needs a staff member who runs the class, and refuses the whole batch on the first policy violation', async () => {
    await expect(provisionStudents(SYSTEM_ACTOR, 'class-a', students)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(
      provisionStudents(session('teacher', 'teacher-9', 'school-b'), 'class-a', students),
    ).rejects.toBeInstanceOf(ForbiddenError);
    vi.mocked(studentAccountContext).mockResolvedValue({
      schoolActive: false,
      ownerVerifiedEducator: true,
    });
    vi.mocked(getClass).mockResolvedValue(
      schoolClass({ id: 'class-a', schoolId: null, ageBand: '13-15' }),
    );
    await expect(provisionStudents(teacher, 'class-a', students)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(auth.createUser).not.toHaveBeenCalled();
    await expect(provisionStudents(teacher, 'class-a', [])).rejects.toBeInstanceOf(ValidationError);
  });

  it('refuses a class that cannot take the batch or is archived', async () => {
    vi.mocked(getClass).mockResolvedValue(schoolClass({ id: 'class-a', studentCount: 59 }));
    await expect(provisionStudents(teacher, 'class-a', students)).rejects.toBeInstanceOf(
      ConflictError,
    );
    vi.mocked(getClass).mockResolvedValue(schoolClass({ id: 'class-a', archived: true }));
    await expect(provisionStudents(teacher, 'class-a', students)).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(auth.createUser).not.toHaveBeenCalled();
  });

  it('creates username accounts with generated credentials, the class age band by default, and adds each to the class', async () => {
    const credentials = await provisionStudents(teacher, 'class-a', students);

    expect(credentials).toHaveLength(2);
    expect(credentials[0]).toMatchObject({
      uid: 'uid-1',
      displayName: 'Léa Martin',
      username: 'lea.martin',
    });
    expect(credentials[1]!.username).toMatch(/^lea\.martin\d{2}$/);
    for (const credential of credentials) expect(credential.password).toMatch(PASSWORD_PATTERN);
    expect(auth.createUser).toHaveBeenCalledTimes(3);
    expect(auth.createUser).toHaveBeenNthCalledWith(2, {
      email: `lea.martin@${STUDENT_EMAIL_DOMAIN}`,
      password: credentials[1]!.password,
      displayName: 'Léa Martin',
    });
    expect(createUserProfile).toHaveBeenNthCalledWith(1, SYSTEM_ACTOR, 'uid-1', {
      role: 'student',
      schoolId: 'school-a',
      displayName: 'Léa Martin',
      username: 'lea.martin',
      email: null,
      ageBand: '11-12',
      locale: 'fr',
      consentBasis: 'school',
      provisionedByUid: 'teacher-1',
    });
    expect(createUserProfile).toHaveBeenNthCalledWith(
      2,
      SYSTEM_ACTOR,
      'uid-2',
      expect.objectContaining({ ageBand: '8-10', username: credentials[1]!.username }),
    );
    expect(adjustSchoolCounts).toHaveBeenCalledTimes(2);
    expect(addStudentToClass).toHaveBeenCalledTimes(2);
    expect(addStudentToClass).toHaveBeenCalledWith(
      SYSTEM_ACTOR,
      'class-a',
      expect.objectContaining({ id: 'uid-2' }),
      'teacher-1',
    );
  });

  it('a school admin provisions too; a class without a school uses the staff member’s locale', async () => {
    vi.mocked(getClass).mockResolvedValue(schoolClass({ id: 'class-solo', schoolId: null }));
    vi.mocked(studentAccountContext).mockResolvedValue({
      schoolActive: false,
      ownerVerifiedEducator: true,
    });
    await provisionStudents(session('teacher', 'teacher-1', null, ['class-solo']), 'class-solo', [
      { displayName: 'Maya', ageBand: '13-15' },
    ]);
    expect(createUserProfile).toHaveBeenCalledWith(
      SYSTEM_ACTOR,
      'uid-1',
      expect.objectContaining({ schoolId: null, locale: 'en', consentBasis: 'self_13_plus' }),
    );
    expect(adjustSchoolCounts).not.toHaveBeenCalled();
    expect(getSchool).not.toHaveBeenCalled();
  });
});

describe('resetStudentPassword', () => {
  beforeEach(() => {
    users.set(
      'lea',
      profile({
        id: 'lea',
        username: 'lea.m',
        email: null,
        schoolId: 'school-a',
        classIds: ['class-a'],
        provisionedByUid: 'teacher-1',
      }),
    );
    users.set('nour', profile({ id: 'nour', schoolId: 'school-a', classIds: ['class-a'] }));
  });

  it('is not found for someone the actor may not see, and refused for an email account', async () => {
    await expect(
      resetStudentPassword(session('teacher', 'teacher-9', 'school-b', ['class-x']), 'lea'),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(resetStudentPassword(teacher, 'nour')).rejects.toBeInstanceOf(ForbiddenError);
    await expect(resetStudentPassword(schoolAdmin, 'nour')).rejects.toBeInstanceOf(ForbiddenError);
    await expect(resetStudentPassword(SYSTEM_ACTOR, 'lea')).rejects.toBeInstanceOf(ForbiddenError);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it('sets a new generated password, ends the sessions and writes the audit entry', async () => {
    const result = await resetStudentPassword(teacher, 'lea');
    expect(result.username).toBe('lea.m');
    expect(result.password).toMatch(PASSWORD_PATTERN);
    expect(auth.updateUser).toHaveBeenCalledWith('lea', { password: result.password });
    expect(invalidateSessions).toHaveBeenCalledWith('lea');
    expect(writeAudit).toHaveBeenCalledWith(teacher, {
      action: 'user.password_reset',
      targetType: 'user',
      targetId: 'lea',
      schoolId: 'school-a',
    });
  });
});

describe('createTeacher', () => {
  const input = { displayName: 'Sami H', email: 'Sami@Example.com', schoolId: 'school-a' };

  it('is for the school’s admin and platform admins, with a valid address', async () => {
    await expect(createTeacher(teacher, input)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      createTeacher(session('school_admin', 'admin-b', 'school-b'), input),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(createTeacher(schoolAdmin, { ...input, email: 'nope' })).rejects.toMatchObject({
      fieldErrors: { email: ['invalid_email'] },
    });
    await expect(
      createTeacher(platformAdmin, { ...input, schoolId: 'school-z' }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(auth.createUser).not.toHaveBeenCalled();
  });

  it('never adopts an existing account', async () => {
    takenEmails.add('sami@example.com');
    await expect(createTeacher(schoolAdmin, input)).rejects.toBeInstanceOf(ConflictError);
    expect(createUserProfile).not.toHaveBeenCalled();
  });

  it('creates an Auth user without a password and a teacher profile in the school’s language', async () => {
    const created = await createTeacher(schoolAdmin, input);
    expect(created.id).toBe('uid-1');
    expect(auth.createUser).toHaveBeenCalledWith({
      email: 'sami@example.com',
      displayName: 'Sami H',
    });
    expect(createUserProfile).toHaveBeenCalledWith(SYSTEM_ACTOR, 'uid-1', {
      role: 'teacher',
      schoolId: 'school-a',
      displayName: 'Sami H',
      username: null,
      email: 'sami@example.com',
      ageBand: 'adult',
      locale: 'fr',
      consentBasis: 'adult',
      provisionedByUid: 'admin-a',
    });
    expect(adjustSchoolCounts).toHaveBeenCalledWith(SYSTEM_ACTOR, 'school-a', { teachers: 1 });
    expect(syncClaims).toHaveBeenCalledWith('uid-1');
  });

  it('removes the Auth user when the profile cannot be written', async () => {
    vi.mocked(createUserProfile).mockRejectedValueOnce(new ConflictError('exists'));
    await expect(createTeacher(schoolAdmin, input)).rejects.toBeInstanceOf(ConflictError);
    expect(auth.deleteUser).toHaveBeenCalledWith('uid-1');
    expect(syncClaims).not.toHaveBeenCalled();
  });
});

describe('createSchoolWithAdmin', () => {
  const input = {
    school: { name: 'New School', country: 'fr', city: null, defaultLocale: 'fr' as const },
    adminDisplayName: 'Head Teacher',
    adminEmail: 'Head@School.test',
  };

  it('is for platform admins, with valid school and admin fields named as the action names them', async () => {
    await expect(createSchoolWithAdmin(schoolAdmin, input)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      createSchoolWithAdmin(platformAdmin, { ...input, school: { ...input.school, name: 'x' } }),
    ).rejects.toMatchObject({ fieldErrors: { 'school.name': ['too_short'] } });
    await expect(
      createSchoolWithAdmin(platformAdmin, { ...input, adminEmail: 'nope' }),
    ).rejects.toMatchObject({ fieldErrors: { adminEmail: ['invalid_email'] } });
    expect(createSchool).not.toHaveBeenCalled();
  });

  it('refuses an existing address before the school is written', async () => {
    takenEmails.add('head@school.test');
    await expect(createSchoolWithAdmin(platformAdmin, input)).rejects.toBeInstanceOf(ConflictError);
    expect(createSchool).not.toHaveBeenCalled();
    expect(auth.createUser).not.toHaveBeenCalled();
  });

  it('creates the school, then its admin account, which is not a seat', async () => {
    const result = await createSchoolWithAdmin(platformAdmin, input);
    expect(result.school.id).toBe('school-new');
    expect(createSchool).toHaveBeenCalledWith(platformAdmin, {
      name: 'New School',
      country: 'FR',
      city: null,
      defaultLocale: 'fr',
    });
    expect(createUserProfile).toHaveBeenCalledWith(SYSTEM_ACTOR, 'uid-1', {
      role: 'school_admin',
      schoolId: 'school-new',
      displayName: 'Head Teacher',
      username: null,
      email: 'head@school.test',
      ageBand: 'adult',
      locale: 'fr',
      consentBasis: 'adult',
      provisionedByUid: 'root',
    });
    expect(result.admin.role).toBe('school_admin');
    expect(adjustSchoolCounts).not.toHaveBeenCalled();
    expect(syncClaims).toHaveBeenCalledWith('uid-1');
    expect(deleteNewSchool).not.toHaveBeenCalled();
  });

  it('deletes the school when the address is taken between the check and createUser', async () => {
    auth.getUserByEmail.mockRejectedValueOnce(
      Object.assign(new Error('none'), { code: 'auth/user-not-found' }),
    );
    takenEmails.add('head@school.test');
    await expect(createSchoolWithAdmin(platformAdmin, input)).rejects.toBeInstanceOf(ConflictError);
    expect(deleteNewSchool).toHaveBeenCalledWith(platformAdmin, 'school-new');
    expect(createUserProfile).not.toHaveBeenCalled();
  });

  it('deletes the school, and the Auth user, when the admin account fails', async () => {
    const authFault = new Error('auth unavailable');
    auth.createUser.mockRejectedValueOnce(authFault);
    await expect(createSchoolWithAdmin(platformAdmin, input)).rejects.toBe(authFault);
    expect(deleteNewSchool).toHaveBeenCalledWith(platformAdmin, 'school-new');

    const profileFault = new Error('firestore unavailable');
    vi.mocked(createUserProfile).mockRejectedValueOnce(profileFault);
    await expect(createSchoolWithAdmin(platformAdmin, input)).rejects.toBe(profileFault);
    expect(auth.deleteUser).toHaveBeenCalledWith('uid-1');
    expect(deleteNewSchool).toHaveBeenCalledTimes(2);
  });

  it('still throws the account’s error when the school cannot be deleted', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const authFault = new Error('auth unavailable');
    auth.createUser.mockRejectedValueOnce(authFault);
    vi.mocked(deleteNewSchool).mockRejectedValueOnce(new Error('delete failed'));
    await expect(createSchoolWithAdmin(platformAdmin, input)).rejects.toBe(authFault);
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });

  it('keeps the school once the admin’s profile exists, even when its claims fail', async () => {
    const claimsFault = new Error('claims unavailable');
    vi.mocked(syncClaims).mockRejectedValueOnce(claimsFault);
    await expect(createSchoolWithAdmin(platformAdmin, input)).rejects.toBe(claimsFault);
    expect(users.get('uid-1')?.schoolId).toBe('school-new');
    expect(deleteNewSchool).not.toHaveBeenCalled();
  });
});

// --- Identity changes -----------------------------------------------------------------------------

describe('changeUserRole', () => {
  beforeEach(() => {
    users.set('nour', profile({ id: 'nour', schoolId: 'school-a', classIds: ['class-a'] }));
    users.set('root', profile({ id: 'root', role: 'platform_admin' }));
    users.set('other', profile({ id: 'other', schoolId: 'school-b' }));
  });

  it('validates the role and the school it needs', async () => {
    await expect(
      changeUserRole(platformAdmin, 'nour', 'principal' as Role, null),
    ).rejects.toMatchObject({ fieldErrors: { role: ['invalid_choice'] } });
    await expect(changeUserRole(platformAdmin, 'nour', 'school_admin', null)).rejects.toMatchObject(
      { fieldErrors: { schoolId: ['required'] } },
    );
    await expect(
      changeUserRole(platformAdmin, 'nour', 'platform_admin', 'school-a'),
    ).rejects.toMatchObject({ fieldErrors: { schoolId: ['invalid'] } });
    await expect(
      changeUserRole(platformAdmin, 'nour', 'teacher', 'school-z'),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(removeUserFromAllClasses).not.toHaveBeenCalled();
  });

  it('nobody changes their own role; a school admin stays inside their school and the two roles', async () => {
    await expect(changeUserRole(platformAdmin, 'root', 'teacher', null)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(
      changeUserRole(schoolAdmin, 'other', 'teacher', 'school-a'),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      changeUserRole(schoolAdmin, 'nour', 'school_admin', 'school-a'),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(changeUserRole(schoolAdmin, 'nour', 'teacher', 'school-b')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(changeUserRole(teacher, 'nour', 'teacher', 'school-a')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(applyIdentityChange).not.toHaveBeenCalled();
  });

  it('empties the classes, then applies the change with session invalidation, then audits', async () => {
    await changeUserRole(schoolAdmin, 'nour', 'teacher', 'school-a');
    expect(removeUserFromAllClasses).toHaveBeenCalledWith(SYSTEM_ACTOR, 'nour');
    expect(applyIdentityChange).toHaveBeenCalledWith(
      'nour',
      { role: 'teacher', schoolId: 'school-a' },
      { invalidateSessions: true },
    );
    expect(vi.mocked(removeUserFromAllClasses).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(applyIdentityChange).mock.invocationCallOrder[0]!,
    );
    expect(writeAudit).toHaveBeenCalledWith(schoolAdmin, {
      action: 'user.role_changed',
      targetType: 'user',
      targetId: 'nour',
      schoolId: 'school-a',
      meta: { role: 'teacher', previousRole: 'student', previousSchoolId: 'school-a' },
    });
  });

  it('a class owner cannot change role while a class of theirs is live; an unchanged identity is a no-op', async () => {
    vi.mocked(removeUserFromAllClasses).mockRejectedValueOnce(new ConflictError('owns a class'));
    await expect(
      changeUserRole(platformAdmin, 'nour', 'teacher', 'school-a'),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(applyIdentityChange).not.toHaveBeenCalled();

    await changeUserRole(platformAdmin, 'nour', 'student', 'school-a');
    expect(removeUserFromAllClasses).toHaveBeenCalledTimes(1);
    expect(writeAudit).not.toHaveBeenCalled();
  });
});

describe('setUserStatus', () => {
  beforeEach(() => {
    users.set(
      'lea',
      profile({
        id: 'lea',
        username: 'lea.m',
        email: null,
        schoolId: 'school-a',
        classIds: ['class-a'],
        provisionedByUid: 'teacher-1',
      }),
    );
    users.set('nour', profile({ id: 'nour', schoolId: 'school-a', classIds: ['class-a'] }));
    users.set('admin-a', profile({ id: 'admin-a', role: 'school_admin', schoolId: 'school-a' }));
  });

  it('validates the status and refuses one’s own account', async () => {
    await expect(
      setUserStatus(platformAdmin, 'lea', 'suspended' as 'disabled'),
    ).rejects.toMatchObject({ fieldErrors: { status: ['invalid_choice'] } });
    await expect(setUserStatus(schoolAdmin, 'admin-a', 'disabled')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(getUser).not.toHaveBeenCalled();
  });

  it('a school actor removes a self-registered student from the class instead of disabling them', async () => {
    await expect(setUserStatus(schoolAdmin, 'nour', 'disabled')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(setUserStatus(teacher, 'nour', 'disabled')).rejects.toBeInstanceOf(ForbiddenError);
    expect(applyIdentityChange).not.toHaveBeenCalled();
    await setUserStatus(platformAdmin, 'nour', 'disabled');
    expect(applyIdentityChange).toHaveBeenCalledWith(
      'nour',
      { status: 'disabled' },
      { invalidateSessions: true },
    );
  });

  it('disables the profile first, then the Auth account, and audits; re-enabling ends no session', async () => {
    await setUserStatus(teacher, 'lea', 'disabled');
    expect(applyIdentityChange).toHaveBeenCalledWith(
      'lea',
      { status: 'disabled' },
      { invalidateSessions: true },
    );
    expect(auth.updateUser).toHaveBeenCalledWith('lea', { disabled: true });
    expect(vi.mocked(applyIdentityChange).mock.invocationCallOrder[0]).toBeLessThan(
      auth.updateUser.mock.invocationCallOrder[0]!,
    );
    expect(writeAudit).toHaveBeenCalledWith(teacher, {
      action: 'user.status_changed',
      targetType: 'user',
      targetId: 'lea',
      schoolId: 'school-a',
      meta: { status: 'disabled', previousStatus: 'active' },
    });

    users.set('lea', { ...users.get('lea')!, status: 'disabled' });
    await setUserStatus(schoolAdmin, 'lea', 'active');
    expect(applyIdentityChange).toHaveBeenLastCalledWith(
      'lea',
      { status: 'active' },
      { invalidateSessions: false },
    );
    expect(auth.updateUser).toHaveBeenLastCalledWith('lea', { disabled: false });

    // The stored status still reads 'disabled' (the identity write is mocked): a repeat is a no-op.
    await setUserStatus(schoolAdmin, 'lea', 'disabled');
    expect(applyIdentityChange).toHaveBeenCalledTimes(2);
    expect(auth.updateUser).toHaveBeenCalledTimes(2);
    expect(writeAudit).toHaveBeenCalledTimes(2);
  });
});

describe('setVerifiedEducator', () => {
  beforeEach(() => {
    users.set('teacher-1', profile({ id: 'teacher-1', role: 'teacher', schoolId: null }));
  });

  it('is for platform admins only and audits the change', async () => {
    await expect(setVerifiedEducator(schoolAdmin, 'teacher-1', true)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(setVerifiedEducator(platformAdmin, 'ghost', true)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await setVerifiedEducator(platformAdmin, 'teacher-1', true);
    expect(writeVerifiedEducator).toHaveBeenCalledWith(platformAdmin, 'teacher-1', true);
    expect(writeAudit).toHaveBeenCalledWith(platformAdmin, {
      action: 'user.educator_verified',
      targetType: 'user',
      targetId: 'teacher-1',
      schoolId: null,
      meta: { verified: true },
    });
  });

  it('passes a repository refusal through', async () => {
    vi.mocked(writeVerifiedEducator).mockRejectedValueOnce(new ConflictError('not a teacher'));
    await expect(setVerifiedEducator(platformAdmin, 'teacher-1', true)).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(writeAudit).not.toHaveBeenCalled();
  });
});
