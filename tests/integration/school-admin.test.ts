import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  getClassReport,
  getPlatformStats,
  getSchoolCourseUsage,
  getSchoolStats,
} from '@/lib/data/analytics';
import { getClass, listMembers } from '@/lib/data/classes';
import { getSchool } from '@/lib/data/schools';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { getAdminAuth } from '@/lib/firebase/admin';
import { collections } from '@/lib/firebase/collections';
import { joinClassWithCode } from '@/lib/services/classroom';
import {
  changeUserRole,
  completeSignup,
  createSchoolWithAdmin,
  createTeacher,
  provisionStudents,
  setUserStatus,
} from '@/lib/services/provisioning';
import type { Role, Session, UserProfile, UserStatus } from '@/types';
import { resetEmulators, seedEmulators, signUpWithPassword } from './support/emulators';
import {
  auditCount,
  CLIENT_KEY,
  DEMO_JOIN_CODE,
  DEMO_UID,
  demoEmail,
  nextSecond,
  profileOf,
  readSeedState,
  refusal,
  SEED_COURSE,
  sessionFor,
  sessionOf,
  type SeedState,
} from './support/world';

// The school admin flow of ARCHITECTURE.md 11.1, as the admin of the demo school: staff
// accounts, identity changes with their counters and audit entries, and the school's numbers.

vi.mock('@/lib/auth/session', () => ({ setSessionCookie: vi.fn(), clearSessionCookie: vi.fn() }));

const COURSE_ID = SEED_COURSE.id;

interface Countable {
  count(): { get(): Promise<{ data(): { count: number } }> };
}

async function countOf(query: Countable): Promise<number> {
  return (await query.count().get()).data().count;
}

describe('school admin flow: teachers, roles, status and the numbers', () => {
  let state: SeedState;
  let admin: Session;
  let schoolAdmin: Session;
  let teacher: Session;
  let betaSchoolId: string;
  let betaTeacher: UserProfile;
  let karim: UserProfile;
  let tarekUid: string;

  beforeAll(async () => {
    await resetEmulators();
    seedEmulators();
    state = await readSeedState();
    admin = await sessionFor(DEMO_UID.admin);
    schoolAdmin = await sessionFor(DEMO_UID.schoolAdmin);
    teacher = await sessionFor(DEMO_UID.teacher);
    const beta = await createSchoolWithAdmin(admin, {
      school: { name: 'Beta School', country: 'LB', city: null, defaultLocale: 'en' },
      adminDisplayName: 'Beta Admin',
      adminEmail: 'admin@beta.test',
    });
    betaSchoolId = beta.school.id;
    betaTeacher = await createTeacher(admin, {
      displayName: 'Beta Teacher',
      email: 'teacher@beta.test',
      schoolId: betaSchoolId,
    });
  }, 240_000);

  it('createTeacher: an account without a password in the school, never an existing address', async () => {
    const teachersBefore = (await getSchool(schoolAdmin, state.schoolId)).counts.teachers;
    karim = await createTeacher(schoolAdmin, {
      displayName: 'Karim Saad',
      email: 'Karim.Saad@Demo.Test',
      schoolId: state.schoolId,
    });
    expect(karim).toMatchObject({
      role: 'teacher',
      schoolId: state.schoolId,
      displayName: 'Karim Saad',
      email: 'karim.saad@demo.test',
      username: null,
      ageBand: 'adult',
      locale: 'en',
      consentBasis: 'adult',
      provisionedByUid: schoolAdmin.uid,
      verifiedEducator: false,
      classIds: [],
      status: 'active',
    });
    const authUser = await getAdminAuth().getUser(karim.id);
    expect(authUser.email).toBe('karim.saad@demo.test');
    expect(authUser.emailVerified).toBe(false);
    expect(authUser.passwordHash).toBeUndefined();
    expect(authUser.customClaims).toEqual({ role: 'teacher', schoolId: state.schoolId });
    expect((await getSchool(schoolAdmin, state.schoolId)).counts.teachers).toBe(teachersBefore + 1);

    const again = {
      displayName: 'Karim Twice',
      email: 'karim.saad@demo.test',
      schoolId: state.schoolId,
    };
    await refusal(createTeacher(schoolAdmin, again), ConflictError);
    await refusal(
      createTeacher(schoolAdmin, { ...again, email: demoEmail('student') }),
      ConflictError,
    );
    await refusal(
      createTeacher(schoolAdmin, { ...again, email: 'new@beta.test', schoolId: betaSchoolId }),
      ForbiddenError,
    );
    await refusal(createTeacher(teacher, { ...again, email: 'new@demo.test' }), ForbiddenError);
    const invalid = await refusal(
      createTeacher(schoolAdmin, {
        displayName: 'K',
        email: 'not-an-email',
        schoolId: state.schoolId,
      }),
      ValidationError,
    );
    expect(invalid.fieldErrors).toEqual({
      displayName: ['display_name_length'],
      email: ['invalid_email'],
    });
    expect((await getSchool(schoolAdmin, state.schoolId)).counts.teachers).toBe(teachersBefore + 1);
  });

  it('changeUserRole: allowed and refused targets; the classes are emptied and the sessions end', async () => {
    const [tarek] = await provisionStudents(schoolAdmin, state.classId, [
      { displayName: 'Tarek Bou' },
    ]);
    tarekUid = tarek!.uid;
    expect((await profileOf(tarekUid)).classIds).toEqual([state.classId]);
    const countsBefore = (await getSchool(schoolAdmin, state.schoolId)).counts;
    const studentsBefore = (await getClass(schoolAdmin, state.classId)).studentCount;

    await changeUserRole(schoolAdmin, tarekUid, 'teacher', state.schoolId);
    const promoted = await profileOf(tarekUid);
    expect(promoted).toMatchObject({ role: 'teacher', schoolId: state.schoolId, classIds: [] });
    expect(promoted.sessionsValidAfter).not.toBeNull();
    expect((await getClass(schoolAdmin, state.classId)).studentCount).toBe(studentsBefore - 1);
    expect(
      (await listMembers(schoolAdmin, state.classId)).some((member) => member.id === tarekUid),
    ).toBe(false);
    const counts = (await getSchool(schoolAdmin, state.schoolId)).counts;
    expect(counts).toEqual({
      ...countsBefore,
      students: countsBefore.students - 1,
      teachers: countsBefore.teachers + 1,
    });
    const authUser = await getAdminAuth().getUser(tarekUid);
    expect(authUser.customClaims).toEqual({ role: 'teacher', schoolId: state.schoolId });
    expect(authUser.tokensValidAfterTime).toBeDefined();
    const audits = await collections
      .auditLogs()
      .where('action', '==', 'user.role_changed')
      .where('targetId', '==', tarekUid)
      .get();
    expect(audits.size).toBe(1);
    expect(audits.docs[0]!.get('meta')).toEqual({
      role: 'teacher',
      previousRole: 'student',
      previousSchoolId: state.schoolId,
    });
    expect(audits.docs[0]!.get('actorUid')).toBe(schoolAdmin.uid);

    // The same identity again is a no-op.
    await changeUserRole(schoolAdmin, tarekUid, 'teacher', state.schoolId);
    expect(await auditCount('user.role_changed', tarekUid)).toBe(1);

    await refusal(changeUserRole(schoolAdmin, karim.id, 'platform_admin', null), ForbiddenError);
    await refusal(
      changeUserRole(schoolAdmin, karim.id, 'school_admin', state.schoolId),
      ForbiddenError,
    );
    await refusal(
      changeUserRole(schoolAdmin, schoolAdmin.uid, 'teacher', state.schoolId),
      ForbiddenError,
    );
    await refusal(changeUserRole(schoolAdmin, karim.id, 'teacher', betaSchoolId), ForbiddenError);
    await refusal(
      changeUserRole(schoolAdmin, betaTeacher.id, 'student', state.schoolId),
      NotFoundError,
    );
    await refusal(changeUserRole(admin, admin.uid, 'teacher', state.schoolId), ForbiddenError);
    const badRole = await refusal(
      changeUserRole(schoolAdmin, karim.id, 'owner' as Role, null),
      ValidationError,
    );
    expect(badRole.fieldErrors).toEqual({ role: ['invalid_choice'] });
    const noSchool = await refusal(
      changeUserRole(admin, karim.id, 'school_admin', null),
      ValidationError,
    );
    expect(noSchool.fieldErrors).toEqual({ schoolId: ['required'] });
    const withSchool = await refusal(
      changeUserRole(admin, karim.id, 'platform_admin', state.schoolId),
      ValidationError,
    );
    expect(withSchool.fieldErrors).toEqual({ schoolId: ['invalid'] });
    await refusal(changeUserRole(admin, karim.id, 'teacher', 'no-such-school'), NotFoundError);
    // The owner of a live class moves out of it first.
    await refusal(
      changeUserRole(schoolAdmin, DEMO_UID.teacher, 'student', state.schoolId),
      ConflictError,
    );
    expect((await profileOf(karim.id)).role).toBe('teacher');

    // A platform admin may make Karim a school admin; school admins are not counted.
    await changeUserRole(admin, karim.id, 'school_admin', state.schoolId);
    expect(await profileOf(karim.id)).toMatchObject({
      role: 'school_admin',
      schoolId: state.schoolId,
    });
    expect((await getSchool(schoolAdmin, state.schoolId)).counts.teachers).toBe(
      counts.teachers - 1,
    );
  });

  it('setUserStatus: the profile, then the Auth flag, then the counters and the audit entry', async () => {
    const teachersBefore = (await getSchool(schoolAdmin, state.schoolId)).counts.teachers;
    const validAfterBefore = (await profileOf(tarekUid)).sessionsValidAfter!;

    // sessionsValidAfter has a grain of one second (1.5); the role change above set it too.
    await nextSecond();
    await setUserStatus(schoolAdmin, tarekUid, 'disabled');
    const disabled = await profileOf(tarekUid);
    expect(disabled.status).toBe('disabled');
    expect(Date.parse(disabled.sessionsValidAfter!)).toBeGreaterThan(Date.parse(validAfterBefore));
    expect((await getAdminAuth().getUser(tarekUid)).disabled).toBe(true);
    expect((await getSchool(schoolAdmin, state.schoolId)).counts.teachers).toBe(teachersBefore - 1);
    const audits = await collections
      .auditLogs()
      .where('action', '==', 'user.status_changed')
      .where('targetId', '==', tarekUid)
      .get();
    expect(audits.size).toBe(1);
    expect(audits.docs[0]!.get('meta')).toEqual({ status: 'disabled', previousStatus: 'active' });

    await setUserStatus(schoolAdmin, tarekUid, 'disabled');
    expect(await auditCount('user.status_changed', tarekUid)).toBe(1);

    await setUserStatus(schoolAdmin, tarekUid, 'active');
    const enabled = await profileOf(tarekUid);
    expect(enabled.status).toBe('active');
    expect(enabled.sessionsValidAfter).toBe(disabled.sessionsValidAfter);
    expect((await getAdminAuth().getUser(tarekUid)).disabled).toBe(false);
    expect((await getSchool(schoolAdmin, state.schoolId)).counts.teachers).toBe(teachersBefore);
    expect(await auditCount('user.status_changed', tarekUid)).toBe(2);

    await refusal(setUserStatus(schoolAdmin, schoolAdmin.uid, 'disabled'), ForbiddenError);
    await refusal(setUserStatus(admin, admin.uid, 'disabled'), ForbiddenError);
    await refusal(setUserStatus(schoolAdmin, betaTeacher.id, 'disabled'), NotFoundError);
    await refusal(setUserStatus(schoolAdmin, 'no-such-user', 'disabled'), NotFoundError);
    // A teacher cannot see a colleague's profile, so there is nothing for them to disable; a
    // username pupil they provisioned in their own class is theirs to manage (4.4).
    await refusal(setUserStatus(teacher, tarekUid, 'disabled'), NotFoundError);
    await setUserStatus(teacher, DEMO_UID.lea, 'disabled');
    expect((await profileOf(DEMO_UID.lea)).status).toBe('disabled');
    await setUserStatus(teacher, DEMO_UID.lea, 'active');
    expect((await profileOf(DEMO_UID.lea)).status).toBe('active');
    const badStatus = await refusal(
      setUserStatus(schoolAdmin, tarekUid, 'frozen' as UserStatus),
      ValidationError,
    );
    expect(badStatus.fieldErrors).toEqual({ status: ['invalid_choice'] });

    // A self-registered student who joined a class of the school is removed, not disabled.
    const { idToken } = await signUpWithPassword('ava.student@example.test', 'signup-password-1');
    const avaProfile = await completeSignup(
      idToken,
      {
        displayName: 'Ava Student',
        role: 'student',
        ageBand: '13-15',
        locale: 'en',
        acceptedTerms: true,
      },
      { clientKey: CLIENT_KEY },
    );
    await joinClassWithCode(sessionOf(avaProfile), DEMO_JOIN_CODE);
    expect((await profileOf(avaProfile.id)).schoolId).toBe(state.schoolId);
    await refusal(setUserStatus(schoolAdmin, avaProfile.id, 'disabled'), ForbiddenError);
    await refusal(setUserStatus(teacher, avaProfile.id, 'disabled'), ForbiddenError);
    const studentsBefore = (await getSchool(schoolAdmin, state.schoolId)).counts.students;
    await setUserStatus(admin, avaProfile.id, 'disabled');
    expect((await profileOf(avaProfile.id)).status).toBe('disabled');
    expect((await getSchool(schoolAdmin, state.schoolId)).counts.students).toBe(studentsBefore - 1);
    await setUserStatus(admin, avaProfile.id, 'active');
    expect((await getSchool(schoolAdmin, state.schoolId)).counts.students).toBe(studentsBefore);

    // A provisioned (username) student of the school may be disabled by its admin.
    await setUserStatus(schoolAdmin, DEMO_UID.maya, 'disabled');
    expect((await profileOf(DEMO_UID.maya)).status).toBe('disabled');
    await setUserStatus(schoolAdmin, DEMO_UID.maya, 'active');
  });

  it('getSchoolStats and getClassReport count what the school and the class hold', async () => {
    const school = await getSchool(schoolAdmin, state.schoolId);
    const inSchool = collections.enrollments().where('schoolId', '==', state.schoolId);
    const enrollments = await countOf(inSchool);
    const completed = await countOf(inSchool.where('status', '==', 'completed'));
    const certificates = await countOf(
      collections.certificates().where('schoolId', '==', state.schoolId),
    );
    expect(enrollments).toBeGreaterThanOrEqual(3);
    expect(completed).toBeGreaterThanOrEqual(1);

    const stats = await getSchoolStats(schoolAdmin, state.schoolId);
    expect(stats).toEqual({
      teachers: school.counts.teachers,
      students: school.counts.students,
      classes: school.counts.classes,
      enrollments,
      completedEnrollments: completed,
      completionRatePercent: Math.round((completed * 100) / enrollments),
      certificates,
      seatsTotal: 100,
      seatsUsed: school.counts.students,
    });
    await refusal(getSchoolStats(teacher, state.schoolId), ForbiddenError);
    await refusal(getSchoolStats(schoolAdmin, betaSchoolId), ForbiddenError);

    const usage = await getSchoolCourseUsage(schoolAdmin, state.schoolId);
    expect(usage.map((row) => row.courseId)).toContain(COURSE_ID);
    expect(usage.find((row) => row.courseId === COURSE_ID)?.enrollments).toBeGreaterThanOrEqual(3);

    const report = await getClassReport(schoolAdmin, state.classId, COURSE_ID);
    expect(report.cls.id).toBe(state.classId);
    expect(report.course.id).toBe(COURSE_ID);
    // The three demo pupils and Ava, who joined above; the roster order is by name.
    expect(report.rows.map((row) => row.student.displayName)).toEqual([
      'Ava Student',
      'Lea Demo',
      'Maya Demo',
      'Omar Demo',
    ]);
    const row = (name: string) =>
      report.rows.find((candidate) => candidate.student.displayName === name);
    const [ava, lea, maya, omar] = [
      row('Ava Student'),
      row('Lea Demo'),
      row('Maya Demo'),
      row('Omar Demo'),
    ];
    expect(ava?.enrollment).toMatchObject({ completedLessonCount: 0, source: 'class' });
    expect(lea).toMatchObject({
      submissionsApproved: 1,
      submissionsPending: 0,
      quizAveragePercent: 100,
    });
    expect(lea?.enrollment?.status).toBe('completed');
    expect(lea?.certificateId).not.toBeNull();
    expect(omar).toMatchObject({ submissionsApproved: 0, submissionsPending: 1 });
    expect(omar?.enrollment?.completedLessonCount).toBe(2);
    expect(maya).toMatchObject({ quizAveragePercent: null, certificateId: null });
    expect(maya?.enrollment).toMatchObject({ completedLessonCount: 0, source: 'class' });

    expect((await getClassReport(teacher, state.classId, COURSE_ID)).rows).toHaveLength(4);
    await refusal(getClassReport(schoolAdmin, state.classId, 'other-course'), ForbiddenError);
    await refusal(
      getClassReport(await sessionFor(betaTeacher.id), state.classId, COURSE_ID),
      NotFoundError,
    );

    const platform = await getPlatformStats(admin);
    expect(platform.schools).toBeGreaterThanOrEqual(2);
    expect(platform.officialCourses).toBeGreaterThanOrEqual(1);
    expect(platform.users.student).toBeGreaterThanOrEqual(4);
    expect(platform.enrollments).toBeGreaterThanOrEqual(enrollments);
    await refusal(getPlatformStats(schoolAdmin), ForbiddenError);
  });
});
