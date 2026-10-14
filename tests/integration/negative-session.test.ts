import { beforeAll, describe, expect, it, vi } from 'vitest';
import { SYSTEM_ACTOR } from '@/lib/auth/actor';
import { assertSessionNotRevoked, getSession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { usernameToEmail } from '@/lib/auth/username';
import { updateClass } from '@/lib/data/classes';
import { getEnrollment, getLessonProgress, listEnrollmentsForUser } from '@/lib/data/enrollments';
import {
  getAttempt,
  getLatestAttempt,
  listAttemptsForClass,
  listRecentAttemptsForUser,
} from '@/lib/data/quizzes';
import {
  getLatestSubmission,
  getSubmission,
  listSubmissionsForStudent,
} from '@/lib/data/submissions';
import { createUserProfile } from '@/lib/data/users';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
} from '@/lib/errors';
import { getAdminAuth } from '@/lib/firebase/admin';
import {
  assignCourseToClass,
  createClass,
  getStudentForTeacher,
  joinClassWithCode,
} from '@/lib/services/classroom';
import { invalidateSessions } from '@/lib/services/identity';
import { getLessonPlayerData, startLesson } from '@/lib/services/learning';
import { reviewSubmission, submitWork } from '@/lib/services/project-flow';
import {
  completeSignup,
  createTeacher,
  endSession,
  establishSession,
  provisionStudents,
  setUserStatus,
} from '@/lib/services/provisioning';
import { issueCertificate } from '@/lib/services/recognition';
import type { Session, Submission } from '@/types';
import {
  resetEmulators,
  seedEmulators,
  signInWithPassword,
  signUpWithPassword,
} from './support/emulators';
import {
  attemptQuiz,
  CLIENT_KEY,
  DEFAULT_DEMO_PASSWORD,
  DEMO_UID,
  nextSecond,
  profileOf,
  projectTarget,
  readSeedState,
  refusal,
  SEED_COURSE,
  SEED_PROJECT_ID,
  seedLesson,
  sessionFor,
  textWork,
  type SeedState,
} from './support/world';

// The negative and session cases of ARCHITECTURE.md 11.1: what a teacher of another class
// cannot read, what a learner never sees of the answer key, a profile written twice, and the
// session cookie from establishSession to invalidation (section 1.5).

// The session module reads and writes the request's cookies; here the request is a jar.
const jar = vi.hoisted(() => new Map<string, string>());
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => {
      jar.set(name, value);
    },
    delete: (name: string) => {
      jar.delete(name);
    },
  }),
}));
vi.mock('next-intl/server', () => ({ getLocale: async () => 'en' }));
vi.mock('@/lib/i18n/navigation', () => ({
  redirect: () => {
    throw new Error('redirect() is not reached in these tests.');
  },
}));

const COURSE_ID = SEED_COURSE.id;
const PASSWORD = 'staff-password-1';

describe('negative cases: records of another class, the student projection, a second profile', () => {
  let state: SeedState;
  let schoolAdmin: Session;
  let teacherX: Session;
  let teacherY: Session;
  let classXId: string;
  let classYId: string;
  let shared: Session;
  let work: Submission;
  const lesson2 = seedLesson(1);
  const quizId = lesson2.quizIds[0]!;

  beforeAll(async () => {
    await resetEmulators();
    seedEmulators();
    state = await readSeedState();
    schoolAdmin = await sessionFor(DEMO_UID.schoolAdmin);

    // One pupil in two classes of the school; the course is assigned by class X only.
    const classX = await createClass(await sessionFor(DEMO_UID.teacher), {
      name: 'Class X',
      gradeLabel: null,
      ageBand: '11-12',
    });
    classXId = classX.id;
    const teacherYProfile = await createTeacher(schoolAdmin, {
      displayName: 'Teacher Y',
      email: 'teacher.y@demo.test',
      schoolId: state.schoolId,
    });
    const classY = await createClass(await sessionFor(teacherYProfile.id), {
      name: 'Class Y',
      gradeLabel: null,
      ageBand: '11-12',
    });
    classYId = classY.id;
    teacherX = await sessionFor(DEMO_UID.teacher);
    teacherY = await sessionFor(teacherYProfile.id);

    const [pupil] = await provisionStudents(teacherX, classXId, [{ displayName: 'Shared Pupil' }]);
    const enabled = await updateClass(teacherY, classYId, { joinCodeEnabled: true });
    await joinClassWithCode(await sessionFor(pupil!.uid), enabled.joinCode);
    await assignCourseToClass(teacherX, classXId, COURSE_ID, null);
    shared = await sessionFor(pupil!.uid);
    expect(shared.classIds.sort()).toEqual([classXId, classYId].sort());

    await startLesson(shared, COURSE_ID, lesson2.id);
    await attemptQuiz(shared, COURSE_ID, quizId, false);
    work = await submitWork(shared, textWork(projectTarget(COURSE_ID, SEED_PROJECT_ID)));
  }, 240_000);

  it('a teacher of class Y cannot read the records the pupil made under class X', async () => {
    expect(await getEnrollment(teacherX, shared.uid, COURSE_ID)).toMatchObject({
      classId: classXId,
      source: 'class',
    });
    expect(work.classId).toBe(classXId);

    await refusal(getEnrollment(teacherY, shared.uid, COURSE_ID), ForbiddenError);
    expect(await listEnrollmentsForUser(teacherY, shared.uid, { classId: classYId })).toEqual([]);
    expect(await listEnrollmentsForUser(teacherX, shared.uid, { classId: classXId })).toHaveLength(
      1,
    );
    await refusal(listEnrollmentsForUser(teacherY, shared.uid), ForbiddenError);
    await refusal(getLessonProgress(teacherY, shared.uid, COURSE_ID, lesson2.id), ForbiddenError);
    expect(await getLessonProgress(teacherX, shared.uid, COURSE_ID, lesson2.id)).not.toBeNull();

    expect(await getLatestAttempt(teacherX, shared.uid, COURSE_ID, quizId)).toMatchObject({
      classId: classXId,
    });
    await refusal(getLatestAttempt(teacherY, shared.uid, COURSE_ID, quizId), ForbiddenError);
    expect(
      await listRecentAttemptsForUser(teacherY, shared.uid, { limit: 5, classId: classYId }),
    ).toEqual([]);
    expect(
      await listRecentAttemptsForUser(teacherX, shared.uid, { limit: 5, classId: classXId }),
    ).toHaveLength(1);
    expect((await listAttemptsForClass(teacherY, classYId)).items).toEqual([]);

    expect((await getSubmission(teacherX, work.id)).id).toBe(work.id);
    await refusal(getSubmission(teacherY, work.id), NotFoundError);
    expect(await listSubmissionsForStudent(teacherY, shared.uid, { classId: classYId })).toEqual(
      [],
    );
    expect(
      await getLatestSubmission(teacherY, shared.uid, {
        courseId: COURSE_ID,
        projectId: SEED_PROJECT_ID,
      }),
    ).toBeNull();
    await refusal(
      reviewSubmission(teacherY, {
        submissionId: work.id,
        decision: 'return',
        criteria: null,
        feedback: 'Not mine.',
      }),
      NotFoundError,
    );
    await refusal(
      issueCertificate(teacherY, { studentUid: shared.uid, courseId: COURSE_ID }),
      ForbiddenError,
    );

    // The roster itself is theirs to see: the pupil is in class Y too.
    expect(await getStudentForTeacher(teacherY, classYId, shared.uid)).toMatchObject({
      uid: shared.uid,
      displayName: 'Shared Pupil',
    });
    await refusal(getStudentForTeacher(teacherY, classXId, shared.uid), NotFoundError);
  });

  it('the student projection hides the results until the reveal rule is met; staff see them', async () => {
    const failed = await getLatestAttempt(shared, shared.uid, COURSE_ID, quizId);
    expect(failed).toMatchObject({ passed: false, results: null });
    expect((await getAttempt(shared, failed!.id)).results).toBeNull();
    expect((await getAttempt(teacherX, failed!.id)).results).not.toBeNull();
    expect(
      (await listRecentAttemptsForUser(shared, shared.uid, { limit: 5 }))[0]?.results,
    ).toBeNull();
    const player = await getLessonPlayerData(shared, COURSE_ID, lesson2.id);
    expect(player.latestAttempts[quizId]?.results).toBeNull();

    const passed = await attemptQuiz(shared, COURSE_ID, quizId, true);
    expect(passed.attempt.results).not.toBeNull();
    expect(passed.correctOptionIds).not.toBeNull();
    expect((await getAttempt(shared, passed.attempt.id)).results).not.toBeNull();
    // Lists never carry the owner's results, whatever the rule.
    expect(
      (await listRecentAttemptsForUser(shared, shared.uid, { limit: 5 }))[0]?.results,
    ).toBeNull();
  });

  it('a profile cannot be created twice', async () => {
    await refusal(
      createUserProfile(SYSTEM_ACTOR, shared.uid, {
        role: 'student',
        schoolId: null,
        displayName: 'Again',
        username: null,
        email: 'again@example.test',
        ageBand: '13-15',
        locale: 'en',
        consentBasis: 'self_13_plus',
        provisionedByUid: null,
      }),
      ConflictError,
    );

    const { idToken } = await signUpWithPassword('twice@example.test', PASSWORD);
    const input = {
      displayName: 'Signed Twice',
      role: 'student' as const,
      ageBand: '13-15' as const,
      locale: 'en' as const,
      acceptedTerms: true as const,
    };
    const profile = await completeSignup(idToken, input, { clientKey: CLIENT_KEY });
    await refusal(completeSignup(idToken, input, { clientKey: CLIENT_KEY }), ConflictError);
    expect((await profileOf(profile.id)).displayName).toBe('Signed Twice');

    // A username account never comes through self sign-up.
    const lea = await signInWithPassword(usernameToEmail('lea.demo'), DEFAULT_DEMO_PASSWORD);
    await refusal(
      completeSignup(
        lea.idToken,
        { ...input, displayName: 'Lea Again' },
        { clientKey: CLIENT_KEY },
      ),
      ForbiddenError,
    );
  });
});

describe('sessions: establishSession, getSession, invalidation and sign-out', () => {
  let state: SeedState;
  let uid: string;
  const email = 'session.teacher@demo.test';

  beforeAll(async () => {
    state = await readSeedState();
    const user = await getAdminAuth().createUser({
      email,
      password: PASSWORD,
      emailVerified: true,
      displayName: 'Session Teacher',
    });
    uid = user.uid;
    await createUserProfile(SYSTEM_ACTOR, uid, {
      role: 'teacher',
      schoolId: state.schoolId,
      displayName: 'Session Teacher',
      username: null,
      email,
      ageBand: 'adult',
      locale: 'en',
      consentBasis: 'adult',
      provisionedByUid: null,
    });
  });

  it('a fresh sign-in becomes a cookie that getSession accepts, and the claims catch up', async () => {
    jar.clear();
    expect(await getSession()).toBeNull();
    const { idToken } = await signInWithPassword(email, PASSWORD);
    const { redirectTo } = await establishSession(idToken, '/teacher/classes');
    expect(redirectTo).toBe('/teacher/classes');
    expect(jar.has(SESSION_COOKIE_NAME)).toBe(true);

    const session = await getSession();
    expect(session).toMatchObject({
      uid,
      role: 'teacher',
      schoolId: state.schoolId,
      displayName: 'Session Teacher',
    });
    await expect(assertSessionNotRevoked()).resolves.toBeUndefined();
    expect((await profileOf(uid)).lastLoginAt).not.toBeNull();
    expect((await getAdminAuth().getUser(uid)).customClaims).toEqual({
      role: 'teacher',
      schoolId: state.schoolId,
    });
    expect((await establishSession(idToken, '/admin/schools')).redirectTo).toBe('/teacher');
  });

  it('a cookie issued before sessionsValidAfter is rejected; a new sign-in is accepted', async () => {
    const { idToken } = await signInWithPassword(email, PASSWORD);
    await establishSession(idToken, null);
    expect(await getSession()).not.toBeNull();

    await nextSecond();
    await invalidateSessions(uid);
    expect(await getSession()).toBeNull();
    await refusal(assertSessionNotRevoked(), UnauthenticatedError);
    await refusal(establishSession(idToken, null), UnauthenticatedError);

    const fresh = await signInWithPassword(email, PASSWORD);
    await establishSession(fresh.idToken, null);
    expect((await getSession())?.uid).toBe(uid);
  });

  it('endSession ends every session of the user, then drops the cookie', async () => {
    const { idToken } = await signInWithPassword(email, PASSWORD);
    await establishSession(idToken, null);
    const cookie = jar.get(SESSION_COOKIE_NAME)!;
    const session = (await getSession())!;

    await nextSecond();
    await endSession(session);
    expect(jar.has(SESSION_COOKIE_NAME)).toBe(false);
    expect(await getSession()).toBeNull();
    // A copy of the cookie kept elsewhere is dead too.
    jar.set(SESSION_COOKIE_NAME, cookie);
    expect(await getSession()).toBeNull();
    await refusal(endSession(SYSTEM_ACTOR), ForbiddenError);
  });

  it('refuses a garbage token, an unverified address, a missing profile and a disabled account', async () => {
    await refusal(establishSession('not-a-token', null), UnauthenticatedError);

    const unverified = await signUpWithPassword('unverified@example.test', PASSWORD);
    await createUserProfile(SYSTEM_ACTOR, unverified.uid, {
      role: 'teacher',
      schoolId: null,
      displayName: 'Unverified Teacher',
      username: null,
      email: 'unverified@example.test',
      ageBand: 'adult',
      locale: 'en',
      consentBasis: 'adult',
      provisionedByUid: null,
    });
    const unverifiedError = await refusal(establishSession(unverified.idToken, null), AppError);
    expect(unverifiedError.code).toBe('email_unverified');

    const orphan = await signUpWithPassword('orphan@example.test', PASSWORD);
    const orphanError = await refusal(establishSession(orphan.idToken, null), AppError);
    expect(orphanError.code).toBe('profile_missing');

    const admin = await sessionFor(DEMO_UID.admin);
    const { idToken } = await signInWithPassword(email, PASSWORD);
    await setUserStatus(admin, uid, 'disabled');
    await refusal(establishSession(idToken, null), ForbiddenError);
    jar.clear();

    // A username account signs in without a verified address and gets a student cookie.
    const lea = await signInWithPassword(usernameToEmail('lea.demo'), DEFAULT_DEMO_PASSWORD);
    expect((await establishSession(lea.idToken, '/student/progress')).redirectTo).toBe(
      '/student/progress',
    );
    expect(await getSession()).toMatchObject({ uid: DEMO_UID.lea, role: 'student' });
  });
});
