import { beforeAll, describe, expect, it, vi } from 'vitest';
import { SYSTEM_ACTOR } from '@/lib/auth/actor';
import { usernameToEmail } from '@/lib/auth/username';
import { listUserBadges } from '@/lib/data/badges';
import { getCertificate, getCertificateByCode } from '@/lib/data/certificates';
import { getClass, listAssignments, listMembers, updateClass } from '@/lib/data/classes';
import {
  createBlock,
  createCourse,
  createLesson,
  createModule,
  setCourseStatus,
} from '@/lib/data/courses';
import { getEnrollment } from '@/lib/data/enrollments';
import { getSchool, updateSchool } from '@/lib/data/schools';
import {
  addReview,
  countReviewQueue,
  getSubmission,
  listReviewQueue,
  listReviews,
} from '@/lib/data/submissions';
import {
  ConflictError,
  ForbiddenError,
  LicenseRequiredError,
  NotFoundError,
  ValidationError,
} from '@/lib/errors';
import { getAdminAuth } from '@/lib/firebase/admin';
import { collections, docIds } from '@/lib/firebase/collections';
import { JOIN_CODE } from '@/lib/limits';
import {
  assignCourseToClass,
  createClass,
  joinClassWithCode,
  lookupJoinCode,
  removeStudentFromClass,
  unassignCourseFromClass,
} from '@/lib/services/classroom';
import { enrollSelf } from '@/lib/services/learning';
import {
  generateAiReview,
  getSubmissionForViewer,
  reviewSubmission,
  submitWork,
} from '@/lib/services/project-flow';
import {
  completeSignup,
  createSchoolWithAdmin,
  createTeacher,
  provisionStudents,
  setVerifiedEducator,
  signUpWithJoinCode,
} from '@/lib/services/provisioning';
import { awardManualBadge, issueCertificate, revokeCertificate } from '@/lib/services/recognition';
import type { ClassInput, JoinSignupInput, SchoolClass, Session, Submission } from '@/types';
import { resetEmulators, seedEmulators, signUpWithPassword } from './support/emulators';
import {
  buildOfficialCourse,
  CLEAN_STORY,
  CLIENT_KEY,
  DEMO_UID,
  finishSeedCourse,
  ledgerIds,
  profileOf,
  projectTarget,
  readSeedState,
  refusal,
  SEED_COURSE,
  SEED_PROJECT_ID,
  sessionFor,
  sessionOf,
  STORY_WITH_EMAIL,
  textWork,
  type BuiltCourse,
  type SeedState,
} from './support/world';

// The teacher flow of ARCHITECTURE.md 11.1: the demo teacher (verified educator of the demo
// school) runs a new class, a self-registered teacher runs one without a school, and the
// account policy of section 1.5 decides who may get an account where. The tests run in order.

vi.mock('@/lib/auth/session', () => ({ setSessionCookie: vi.fn(), clearSessionCookie: vi.fn() }));

const COURSE_ID = SEED_COURSE.id;
const CTX = { clientKey: CLIENT_KEY };
const JOIN_CODE_PATTERN = new RegExp(`^[${JOIN_CODE.alphabet}]{${JOIN_CODE.length}}$`);
const PASSWORD_PATTERN = /^[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}$/;

const CLASS_INPUT: ClassInput = { name: 'Grade 7 B', gradeLabel: 'Grade 7', ageBand: '11-12' };

async function signUp(
  email: string,
  displayName: string,
  role: 'student' | 'teacher',
): Promise<Session> {
  const { idToken } = await signUpWithPassword(email, 'signup-password-1');
  const profile = await completeSignup(
    idToken,
    {
      displayName,
      role,
      ageBand: role === 'teacher' ? 'adult' : '13-15',
      locale: 'en',
      acceptedTerms: true,
    },
    CTX,
  );
  return sessionOf(profile);
}

async function uidOfUsername(username: string): Promise<string> {
  return (await getAdminAuth().getUserByEmail(usernameToEmail(username))).uid;
}

async function studentsCounted(schoolId: string): Promise<number> {
  return (await getSchool(SYSTEM_ACTOR, schoolId)).counts.students;
}

describe('teacher flow: classes, accounts, assignments, reviews and recognition', () => {
  let state: SeedState;
  let admin: Session;
  let schoolAdmin: Session;
  let teacher: Session;
  let indie: Session;
  let ava: Session;
  let bea: Session;
  let premium: BuiltCourse;
  let academy: BuiltCourse;

  let cls: SchoolClass;
  let indieClass: SchoolClass;
  let noorUid: string;
  let jadUid: string;
  let avaWork: Submission;

  beforeAll(async () => {
    await resetEmulators();
    seedEmulators();
    state = await readSeedState();
    admin = await sessionFor(DEMO_UID.admin);
    schoolAdmin = await sessionFor(DEMO_UID.schoolAdmin);
    teacher = await sessionFor(DEMO_UID.teacher);
    indie = await signUp('indie.teacher@example.test', 'Indie Teacher', 'teacher');
    ava = await signUp('ava.student@example.test', 'Ava Student', 'student');
    premium = await buildOfficialCourse(admin, { title: 'Premium course', accessTier: 'premium' });
    academy = await buildOfficialCourse(admin, { title: 'Academy course', audience: 'teacher' });
  }, 240_000);

  it('createClass: a teacher owns a class in their school; admins name an active teacher of it', async () => {
    const classesBefore = (await getSchool(schoolAdmin, state.schoolId)).counts.classes;
    cls = await createClass(teacher, CLASS_INPUT);
    expect(cls).toMatchObject({
      schoolId: state.schoolId,
      name: 'Grade 7 B',
      gradeLabel: 'Grade 7',
      ageBand: '11-12',
      ownerUid: teacher.uid,
      teacherUids: [teacher.uid],
      joinCodeEnabled: false,
      joinCodeExpiresAt: null,
      studentCount: 0,
      assignedCourseIds: [],
      archived: false,
    });
    expect(cls.joinCode).toMatch(JOIN_CODE_PATTERN);
    expect((await getSchool(schoolAdmin, state.schoolId)).counts.classes).toBe(classesBefore + 1);

    await refusal(createClass(SYSTEM_ACTOR, CLASS_INPUT), ForbiddenError);
    const noOwner = await refusal(createClass(schoolAdmin, CLASS_INPUT), ValidationError);
    expect(noOwner.fieldErrors).toEqual({ ownerUid: ['required'] });
    const notTeacher = await refusal(
      createClass(schoolAdmin, { ...CLASS_INPUT, ownerUid: DEMO_UID.lea }),
      ValidationError,
    );
    expect(notTeacher.fieldErrors).toEqual({ ownerUid: ['invalid_choice'] });
    await refusal(createClass(schoolAdmin, { ...CLASS_INPUT, ownerUid: indie.uid }), NotFoundError);
    const byAdmin = await createClass(schoolAdmin, {
      ...CLASS_INPUT,
      name: 'Grade 8 C',
      ownerUid: teacher.uid,
    });
    expect(byAdmin).toMatchObject({ schoolId: state.schoolId, ownerUid: teacher.uid });

    indieClass = await createClass(indie, {
      name: 'Robotics club',
      gradeLabel: null,
      ageBand: '13-15',
    });
    expect(indieClass).toMatchObject({ schoolId: null, ownerUid: indie.uid });

    teacher = await sessionFor(teacher.uid);
    expect(teacher.classIds).toEqual(expect.arrayContaining([cls.id, byAdmin.id]));
    indie = await sessionFor(indie.uid);
    expect(indie.classIds).toEqual([indieClass.id]);
  });

  it('provisionStudents in a school class: any age band, the school as consenting party, credentials shown once', async () => {
    const countedBefore = await studentsCounted(state.schoolId);
    const credentials = await provisionStudents(teacher, cls.id, [
      { displayName: 'Noor Haddad' },
      { displayName: 'Jad', ageBand: '8-10' },
    ]);
    expect(credentials).toHaveLength(2);
    const [noor, jad] = credentials as [(typeof credentials)[0], (typeof credentials)[1]];
    expect(noor.username).toBe('noor.haddad');
    expect(noor.password).toMatch(PASSWORD_PATTERN);
    expect(jad.username).toBe('jad');
    noorUid = noor.uid;
    jadUid = jad.uid;

    expect(await profileOf(noor.uid)).toMatchObject({
      role: 'student',
      schoolId: state.schoolId,
      displayName: 'Noor Haddad',
      username: 'noor.haddad',
      email: null,
      ageBand: cls.ageBand,
      locale: 'en',
      consentBasis: 'school',
      provisionedByUid: teacher.uid,
      classIds: [cls.id],
    });
    expect((await profileOf(jad.uid)).ageBand).toBe('8-10');
    const authUser = await getAdminAuth().getUser(noor.uid);
    expect(authUser.email).toBe(usernameToEmail('noor.haddad'));
    expect(authUser.customClaims).toEqual({ role: 'student', schoolId: state.schoolId });

    const members = await listMembers(teacher, cls.id);
    expect(members.map((member) => member.displayName)).toEqual(['Jad', 'Noor Haddad']);
    expect(members.every((member) => member.addedByUid === teacher.uid)).toBe(true);
    expect((await getClass(teacher, cls.id)).studentCount).toBe(2);
    expect(await studentsCounted(state.schoolId)).toBe(countedBefore + 2);

    await refusal(provisionStudents(teacher, cls.id, []), ValidationError);
    await refusal(provisionStudents(indie, cls.id, [{ displayName: 'Nobody' }]), NotFoundError);
    const [mira] = await provisionStudents(schoolAdmin, cls.id, [{ displayName: 'Mira' }]);
    expect(mira?.username).toBe('mira');
    expect((await profileOf(mira!.uid)).provisionedByUid).toBe(schoolAdmin.uid);
  });

  it('a class without a school creates accounts only for 13+ once its owner is verified', async () => {
    const teen = { displayName: 'Teen One', ageBand: '13-15' as const };
    await refusal(provisionStudents(indie, indieClass.id, [teen]), ForbiddenError);

    indieClass = await updateClass(indie, indieClass.id, { joinCodeEnabled: true });
    expect(indieClass.joinCodeExpiresAt).not.toBeNull();
    const joinInput: JoinSignupInput = {
      joinCode: indieClass.joinCode,
      displayName: 'Kid Two',
      username: 'kid.two',
      password: 'kid-password-1',
      ageBand: '13-15',
      locale: 'en',
      acceptedTerms: true,
    };
    await refusal(signUpWithJoinCode(joinInput, CTX), ForbiddenError);
    expect(await lookupJoinCode(indieClass.joinCode, CTX)).toEqual({
      className: 'Robotics club',
      accountCreation: false,
      under13Allowed: false,
    });

    await setVerifiedEducator(admin, indie.uid, true);
    expect(await lookupJoinCode(indieClass.joinCode, CTX)).toMatchObject({
      accountCreation: true,
      under13Allowed: false,
    });
    const [teenAccount] = await provisionStudents(indie, indieClass.id, [teen]);
    expect(await profileOf(teenAccount!.uid)).toMatchObject({
      schoolId: null,
      ageBand: '13-15',
      consentBasis: 'self_13_plus',
      locale: indie.locale,
      provisionedByUid: indie.uid,
    });
    await refusal(
      provisionStudents(indie, indieClass.id, [{ displayName: 'Kid', ageBand: '8-10' }]),
      ForbiddenError,
    );
    // The batch is refused as a whole: the first student is not created either.
    await refusal(
      provisionStudents(indie, indieClass.id, [
        { displayName: 'Fine' },
        { displayName: 'Kid', ageBand: '11-12' },
      ]),
      ForbiddenError,
    );
    expect((await getClass(indie, indieClass.id)).studentCount).toBe(1);

    expect(await signUpWithJoinCode({ ...joinInput, ageBand: '16-18' }, CTX)).toEqual({
      username: 'kid.two',
    });
    expect(await profileOf(await uidOfUsername('kid.two'))).toMatchObject({
      role: 'student',
      schoolId: null,
      username: 'kid.two',
      ageBand: '16-18',
      consentBasis: 'self_13_plus',
      provisionedByUid: null,
      classIds: [indieClass.id],
    });
    await refusal(
      signUpWithJoinCode({ ...joinInput, username: 'kid.three', ageBand: '11-12' }, CTX),
      ForbiddenError,
    );
    const taken = await refusal(
      signUpWithJoinCode({ ...joinInput, displayName: 'Kid Again' }, CTX),
      ValidationError,
    );
    expect(taken.fieldErrors).toEqual({ username: ['duplicate'] });
    await refusal(signUpWithJoinCode({ ...joinInput, joinCode: 'ZZZZZZZZ' }, CTX), NotFoundError);

    // A school class takes every age band by its code, once the code is switched on.
    await refusal(lookupJoinCode(cls.joinCode, CTX), NotFoundError);
    cls = await updateClass(teacher, cls.id, { joinCodeEnabled: true });
    expect(await lookupJoinCode(` ${cls.joinCode.toLowerCase()} `, CTX)).toEqual({
      className: 'Grade 7 B',
      accountCreation: true,
      under13Allowed: true,
    });
    await signUpWithJoinCode(
      {
        ...joinInput,
        joinCode: cls.joinCode,
        displayName: 'Sami K',
        username: 'sami.k',
        ageBand: '8-10',
      },
      CTX,
    );
    expect(await profileOf(await uidOfUsername('sami.k'))).toMatchObject({
      schoolId: state.schoolId,
      consentBasis: 'school',
      classIds: [cls.id],
    });
  });

  it('joinClassWithCode: a signed-in student joins and is attached; a pupil of another school is refused', async () => {
    // Ava learns alone first: an unsupervised enrollment and an open submission.
    const enrollment = await enrollSelf(ava, COURSE_ID);
    expect(enrollment.classId).toBeNull();
    avaWork = await submitWork(ava, textWork(projectTarget(COURSE_ID, SEED_PROJECT_ID)));
    expect(avaWork).toMatchObject({ classId: null, schoolId: null });

    const countedBefore = await studentsCounted(state.schoolId);
    const studentsBefore = (await getClass(teacher, cls.id)).studentCount;
    const joined = await joinClassWithCode(ava, cls.joinCode);
    expect(joined.id).toBe(cls.id);
    expect(joined.studentCount).toBe(studentsBefore + 1);
    ava = await sessionFor(ava.uid);
    expect(ava.schoolId).toBe(state.schoolId);
    expect(ava.classIds).toEqual([cls.id]);
    expect(await profileOf(ava.uid)).toMatchObject({
      username: null,
      consentBasis: 'self_13_plus',
    });
    expect(await studentsCounted(state.schoolId)).toBe(countedBefore + 1);
    // The open work now has a reviewing class; the enrollment waits for an assignment.
    expect(await getSubmission(SYSTEM_ACTOR, avaWork.id)).toMatchObject({
      classId: cls.id,
      schoolId: state.schoolId,
    });
    expect((await getEnrollment(ava, ava.uid, COURSE_ID))?.classId).toBeNull();
    // Joining again changes nothing.
    expect((await joinClassWithCode(ava, cls.joinCode)).studentCount).toBe(studentsBefore + 1);

    const beta = await createSchoolWithAdmin(admin, {
      school: { name: 'Beta School', country: 'LB', city: null, defaultLocale: 'fr' },
      adminDisplayName: 'Beta Admin',
      adminEmail: 'admin@beta.test',
    });
    const betaAdmin = await sessionFor(beta.admin.id);
    const betaTeacher = await createTeacher(betaAdmin, {
      displayName: 'Beta Teacher',
      email: 'teacher@beta.test',
      schoolId: beta.school.id,
    });
    const betaClass = await createClass(await sessionFor(betaTeacher.id), {
      name: 'Beta 1',
      gradeLabel: null,
      ageBand: '11-12',
    });
    const [beaAccount] = await provisionStudents(await sessionFor(betaTeacher.id), betaClass.id, [
      { displayName: 'Bea' },
    ]);
    bea = await sessionFor(beaAccount!.uid);
    await refusal(joinClassWithCode(bea, cls.joinCode), ConflictError);
    await refusal(joinClassWithCode(teacher, cls.joinCode), ForbiddenError);

    // A school that switched join codes off answers "no such class".
    const school = await getSchool(schoolAdmin, state.schoolId);
    await updateSchool(schoolAdmin, state.schoolId, {
      settings: { ...school.settings, joinCodesEnabled: false },
    });
    const sami = await sessionFor(await uidOfUsername('sami.k'));
    await refusal(joinClassWithCode(sami, cls.joinCode), NotFoundError);
    await updateSchool(schoolAdmin, state.schoolId, { settings: school.settings });
  });

  it('assignCourseToClass adopts the self enrollment, re-points open work and enrols the roster', async () => {
    // What re-pointing covers: open work that no class has claimed yet.
    await collections.submissions().doc(avaWork.id).update({ classId: null, schoolId: null });
    const dueAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await assignCourseToClass(teacher, cls.id, COURSE_ID, dueAt);

    cls = await getClass(teacher, cls.id);
    expect(cls.assignedCourseIds).toEqual([COURSE_ID]);
    expect(await listAssignments(teacher, cls.id)).toMatchObject([
      { courseId: COURSE_ID, assignedByUid: teacher.uid, dueAt },
    ]);
    expect(await getEnrollment(ava, ava.uid, COURSE_ID)).toMatchObject({
      classId: cls.id,
      schoolId: state.schoolId,
      source: 'class',
    });
    expect(await getSubmission(teacher, avaWork.id)).toMatchObject({
      classId: cls.id,
      schoolId: state.schoolId,
    });
    expect(await getEnrollment(SYSTEM_ACTOR, noorUid, COURSE_ID)).toMatchObject({
      classId: cls.id,
      source: 'class',
      totalLessonCount: SEED_COURSE.lessons.length,
    });

    await refusal(assignCourseToClass(teacher, cls.id, academy.course.id, null), ConflictError);
    await refusal(
      assignCourseToClass(indie, indieClass.id, premium.course.id, null),
      LicenseRequiredError,
    );
    await refusal(assignCourseToClass(indie, cls.id, COURSE_ID, null), NotFoundError);

    // The school licence covers every official course, premium included.
    await assignCourseToClass(teacher, cls.id, premium.course.id, null);
    expect((await getEnrollment(SYSTEM_ACTOR, noorUid, premium.course.id))?.source).toBe('class');
    await unassignCourseFromClass(teacher, cls.id, premium.course.id);
    expect((await getClass(teacher, cls.id)).assignedCourseIds).toEqual([COURSE_ID]);
    expect(await getEnrollment(SYSTEM_ACTOR, noorUid, premium.course.id)).not.toBeNull();
  });

  it('reviewSubmission: approve needs a clean suggestion; modify grades by the rubric; return allows a resubmission', async () => {
    expect((await listReviewQueue(teacher, teacher.classIds)).map((work) => work.id)).toContain(
      avaWork.id,
    );
    expect(await countReviewQueue(teacher, [cls.id])).toBe(1);
    const approve = { submissionId: avaWork.id, decision: 'approve' as const, criteria: null };
    await refusal(reviewSubmission(teacher, { ...approve, feedback: 'Fine.' }), ConflictError);

    await generateAiReview(avaWork.id);
    const asTeacher = await getSubmissionForViewer(teacher, avaWork.id);
    expect(asTeacher.submission).toMatchObject({ status: 'submitted', aiReviewStatus: 'ready' });
    expect(asTeacher.aiReview).toMatchObject({ status: 'ready', flags: [], confidence: 'high' });
    expect(asTeacher.reviews).toEqual([]);
    const asAva = await getSubmissionForViewer(ava, avaWork.id);
    expect(asAva.aiReview).toBeNull();
    expect(asAva.reviews).toEqual([]);

    // The grading transaction itself refuses an approval of a suggestion that is no longer the
    // latest one (a co-teacher asked for a new one after reviewSubmission read the submission).
    const scores = { creativity: 80, technicalQuality: 80, understanding: 80, responsibleAi: 80 };
    await refusal(
      addReview(teacher, avaWork.id, {
        decision: 'approve',
        criteria: scores,
        score: 80,
        feedback: 'Stale.',
        aiReviewId: 'an-older-suggestion',
      }),
      ConflictError,
    );
    expect(await getSubmission(teacher, avaWork.id)).toMatchObject({ status: 'submitted' });

    const approved = await reviewSubmission(teacher, {
      ...approve,
      feedback: 'Approved as suggested.',
    });
    const suggestion = asTeacher.aiReview!;
    expect(approved.submission).toMatchObject({
      status: 'approved',
      finalScore: suggestion.overallSuggestedScore,
      finalCriteria: {
        creativity: suggestion.criteria!.creativity.score,
        technicalQuality: suggestion.criteria!.technicalQuality.score,
        understanding: suggestion.criteria!.understanding.score,
        responsibleAi: suggestion.criteria!.responsibleAi.score,
      },
      finalFeedback: 'Approved as suggested.',
      reviewedByUid: teacher.uid,
      effectsApplied: true,
      xpAwarded: SEED_COURSE.projectXp[SEED_PROJECT_ID],
    });
    expect(approved.gamification?.xpAwarded).toBe(SEED_COURSE.projectXp[SEED_PROJECT_ID]);
    expect(await listReviews(teacher, avaWork.id)).toMatchObject([
      {
        reviewerUid: teacher.uid,
        decision: 'approve',
        score: suggestion.overallSuggestedScore,
        aiReviewId: asTeacher.submission.latestAiReviewId,
      },
    ]);
    await refusal(listReviews(ava, avaWork.id), ForbiddenError);
    expect((await profileOf(ava.uid)).stats.projectsAccepted).toBe(1);
    await refusal(reviewSubmission(teacher, { ...approve, feedback: 'Twice.' }), ConflictError);

    // Flagged work cannot be approved as it is; the teacher grades it instead.
    const noor = await sessionFor(noorUid);
    const noorWork = await submitWork(
      noor,
      textWork(projectTarget(COURSE_ID, SEED_PROJECT_ID), STORY_WITH_EMAIL),
    );
    await generateAiReview(noorWork.id);
    const flagged = await getSubmissionForViewer(teacher, noorWork.id);
    expect(flagged.aiReview?.flags).toContain('possible_personal_data');
    await refusal(
      reviewSubmission(teacher, { ...approve, submissionId: noorWork.id, feedback: 'Ok.' }),
      ConflictError,
    );
    const noScores = await refusal(
      reviewSubmission(teacher, {
        submissionId: noorWork.id,
        decision: 'modify',
        criteria: null,
        feedback: 'Scores?',
      }),
      ValidationError,
    );
    expect(noScores.fieldErrors).toHaveProperty('criteria');
    const modified = await reviewSubmission(teacher, {
      submissionId: noorWork.id,
      decision: 'modify',
      criteria: { creativity: 80, technicalQuality: 60, understanding: 70, responsibleAi: 90 },
      feedback: 'Leave your address out next time.',
    });
    expect(modified.submission).toMatchObject({
      status: 'approved',
      finalScore: 75,
      finalCriteria: { creativity: 80, technicalQuality: 60, understanding: 70, responsibleAi: 90 },
    });
    expect(modified.gamification?.xpAwarded).toBe(SEED_COURSE.projectXp[SEED_PROJECT_ID]);

    // Returned work is redone as a second attempt that replaces the latest one.
    const jad = await sessionFor(jadUid);
    const target = projectTarget(COURSE_ID, SEED_PROJECT_ID);
    const jadWork = await submitWork(jad, textWork(target));
    const returned = await reviewSubmission(teacher, {
      submissionId: jadWork.id,
      decision: 'return',
      criteria: null,
      feedback: 'Add an ending.',
    });
    expect(returned.gamification).toBeNull();
    expect(returned.submission).toMatchObject({
      status: 'returned',
      finalScore: null,
      finalCriteria: null,
      finalFeedback: 'Add an ending.',
      reviewedByUid: teacher.uid,
      xpAwarded: 0,
    });
    expect(
      (await getEnrollment(jad, jad.uid, COURSE_ID))?.projectSummary[SEED_PROJECT_ID],
    ).toMatchObject({ attempts: 1, latestStatus: 'returned' });
    await refusal(
      submitWork(jad, textWork(target, CLEAN_STORY, { previousSubmissionId: 'stale' })),
      ConflictError,
    );
    const second = await submitWork(
      jad,
      textWork(target, `${CLEAN_STORY} And they lived happily ever after.`, {
        previousSubmissionId: jadWork.id,
      }),
    );
    expect(second).toMatchObject({
      id: docIds.projectSubmission(jad.uid, COURSE_ID, SEED_PROJECT_ID, 2),
      attemptNumber: 2,
      previousSubmissionId: jadWork.id,
      status: 'submitted',
      classId: cls.id,
    });
    expect((await getEnrollment(jad, jad.uid, COURSE_ID))?.projectSummary[SEED_PROJECT_ID]).toEqual(
      {
        attempts: 2,
        latestSubmissionId: second.id,
        latestStatus: 'submitted',
      },
    );
    const review = {
      submissionId: second.id,
      decision: 'return' as const,
      criteria: null,
      feedback: 'x',
    };
    await refusal(reviewSubmission(indie, review), NotFoundError);
    await refusal(reviewSubmission(schoolAdmin, review), ForbiddenError);
  });

  it('issueCertificate, revokeCertificate and a re-issue with a new code', async () => {
    const forNoor = { studentUid: noorUid, courseId: COURSE_ID };
    await refusal(issueCertificate(teacher, forNoor), ConflictError);
    await refusal(
      issueCertificate(teacher, { studentUid: bea.uid, courseId: COURSE_ID }),
      NotFoundError,
    );
    await refusal(
      issueCertificate(teacher, { studentUid: noorUid, courseId: premium.course.id }),
      ForbiddenError,
    );

    const issued = await issueCertificate(admin, forNoor);
    expect(issued).toMatchObject({
      id: docIds.certificate(noorUid, COURSE_ID),
      userUid: noorUid,
      recipientName: 'Noor Haddad',
      isOfficial: true,
      schoolId: state.schoolId,
      schoolName: 'Demo Academy',
      issuedBy: admin.uid,
      issuerName: admin.displayName,
      status: 'issued',
    });
    expect((await getEnrollment(SYSTEM_ACTOR, noorUid, COURSE_ID))?.certificateId).toBe(issued.id);
    expect((await profileOf(noorUid)).stats.certificates).toBe(1);

    await refusal(revokeCertificate(teacher, issued.id, 'Not mine to revoke'), ForbiddenError);
    await revokeCertificate(admin, issued.id, 'Issued by mistake');
    const revoked = await getCertificate(teacher, issued.id);
    expect(revoked).toMatchObject({ status: 'revoked', revokedReason: 'Issued by mistake' });
    expect(revoked.revokedAt).not.toBeNull();
    expect((await getEnrollment(SYSTEM_ACTOR, noorUid, COURSE_ID))?.certificateId).toBeNull();
    expect((await profileOf(noorUid)).stats.certificates).toBe(0);
    expect((await getCertificateByCode(issued.verificationCode))?.status).toBe('revoked');
    await revokeCertificate(admin, issued.id, 'Again');
    expect((await getCertificate(admin, issued.id)).revokedReason).toBe('Issued by mistake');

    // Finishing the course does not undo the revocation; the teacher issues again by hand.
    const noor = await sessionFor(noorUid);
    const last = await finishSeedCourse(noor);
    expect(last.enrollment.status).toBe('completed');
    expect(last.gamification?.certificate).toBeNull();
    expect(last.gamification?.newBadges.map((badge) => badge.id)).toContain(SEED_COURSE.pathwayId);
    expect((await getEnrollment(SYSTEM_ACTOR, noorUid, COURSE_ID))?.certificateId).toBeNull();

    const reissued = await issueCertificate(teacher, forNoor);
    expect(reissued).toMatchObject({ id: issued.id, status: 'issued', issuedBy: teacher.uid });
    expect(reissued.verificationCode).not.toBe(issued.verificationCode);
    expect(await getCertificateByCode(issued.verificationCode)).toBeNull();
    expect(await getCertificateByCode(reissued.verificationCode)).toMatchObject({
      status: 'issued',
      schoolName: 'Demo Academy',
    });
    expect((await getEnrollment(SYSTEM_ACTOR, noorUid, COURSE_ID))?.certificateId).toBe(issued.id);
    expect((await profileOf(noorUid)).stats.certificates).toBe(1);
    expect((await issueCertificate(teacher, forNoor)).verificationCode).toBe(
      reissued.verificationCode,
    );
  });

  it('awardManualBadge: once per student, with its XP bonus and an audit entry', async () => {
    const before = await profileOf(noorUid);
    const award = {
      studentUid: noorUid,
      badgeId: 'responsible-ai-champion',
      note: 'Credited the tutor.',
    };
    expect(await awardManualBadge(teacher, award)).toEqual({ awarded: true });
    const after = await profileOf(noorUid);
    expect(after.xpTotal).toBe(before.xpTotal + 50);
    expect(after.stats.badges).toBe(before.stats.badges + 1);
    expect(await ledgerIds(noorUid)).toContain(docIds.xpEntry('badge', award.badgeId));
    const badges = await listUserBadges(teacher, noorUid);
    expect(badges.find((badge) => badge.badgeId === award.badgeId)).toMatchObject({
      awardedBy: teacher.uid,
      note: award.note,
    });
    const audits = await collections
      .auditLogs()
      .where('action', '==', 'badge.awarded')
      .where('targetId', '==', noorUid)
      .get();
    expect(audits.size).toBe(1);

    expect(await awardManualBadge(teacher, award)).toEqual({ awarded: false });
    expect((await profileOf(noorUid)).xpTotal).toBe(after.xpTotal);
    await refusal(
      awardManualBadge(teacher, { ...award, badgeId: 'data-detective' }),
      ConflictError,
    );
    await refusal(awardManualBadge(teacher, { ...award, badgeId: 'no-such-badge' }), NotFoundError);
    await refusal(awardManualBadge(teacher, { ...award, studentUid: bea.uid }), NotFoundError);
    await refusal(awardManualBadge(schoolAdmin, award), ForbiddenError);
  });

  it('removeStudentFromClass detaches a self-registered student, keeps a provisioned one', async () => {
    const countedBefore = await studentsCounted(state.schoolId);
    const studentsBefore = (await getClass(teacher, cls.id)).studentCount;

    await removeStudentFromClass(teacher, cls.id, ava.uid);
    expect((await listMembers(teacher, cls.id)).some((member) => member.id === ava.uid)).toBe(
      false,
    );
    expect((await getClass(teacher, cls.id)).studentCount).toBe(studentsBefore - 1);
    expect(await profileOf(ava.uid)).toMatchObject({ classIds: [], schoolId: null });
    expect(await studentsCounted(state.schoolId)).toBe(countedBefore - 1);
    expect(await getEnrollment(SYSTEM_ACTOR, ava.uid, COURSE_ID)).toMatchObject({
      classId: null,
      schoolId: null,
    });
    // Reviewed work keeps the class it was reviewed in.
    expect((await getSubmission(SYSTEM_ACTOR, avaWork.id)).classId).toBe(cls.id);
    await refusal(removeStudentFromClass(teacher, cls.id, ava.uid), NotFoundError);

    await removeStudentFromClass(teacher, cls.id, noorUid);
    expect(await profileOf(noorUid)).toMatchObject({ classIds: [], schoolId: state.schoolId });
    expect((await getEnrollment(SYSTEM_ACTOR, noorUid, COURSE_ID))?.classId).toBeNull();

    await refusal(removeStudentFromClass(indie, cls.id, jadUid), NotFoundError);
    await removeStudentFromClass(schoolAdmin, cls.id, jadUid);
    expect((await profileOf(jadUid)).classIds).toEqual([]);
  });

  it('setCourseStatus publishes a teacher-made course only once every module and lesson has content', async () => {
    const draft = await createCourse(teacher, {
      defaultLocale: 'en',
      translations: {
        en: {
          title: 'Sorting robots',
          summary: 'A course the teacher writes.',
          description: 'Written by the integration suite.',
          outcomes: ['Sort by colour'],
        },
      },
      audience: 'student',
      area: 'robotics',
      tags: [],
      ageMin: null,
      ageMax: null,
      estimatedMinutes: 20,
      visibility: 'school',
      certificateEnabled: false,
      coverImageFileId: null,
      hardwarePlatformIds: [],
      requiredCapabilities: [],
    });
    expect(draft).toMatchObject({ status: 'draft', isOfficial: false, ownerUid: teacher.uid });
    const notReady = async () => {
      const error = await refusal(setCourseStatus(teacher, draft.id, 'published'), ValidationError);
      expect(error.fieldErrors).toEqual({ status: ['content_required'] });
      expect((await collections.courses().doc(draft.id).get()).get('status')).toBe('draft');
    };

    await notReady(); // no module
    const courseModule = await createModule(teacher, draft.id, {
      defaultLocale: 'en',
      translations: { en: { title: 'Colours', description: 'The only module.' } },
    });
    await notReady(); // a module without lessons
    const lesson = await createLesson(teacher, draft.id, courseModule.id, {
      defaultLocale: 'en',
      translations: { en: { title: 'Red and blue', summary: 'The only lesson.' } },
      estimatedMinutes: 10,
      xpReward: 50,
    });
    await notReady(); // a lesson without blocks
    await createBlock(teacher, draft.id, lesson.id, {
      type: 'rich_text',
      stage: 'learn',
      defaultLocale: 'en',
      translations: { en: { heading: null, body: 'Robots sort by colour with a sensor.' } },
      data: {},
    });

    const published = await setCourseStatus(teacher, draft.id, 'published');
    expect(published.status).toBe('published');
    expect(published.publishedAt).not.toBeNull();
    // Publishing again is a no-op; leaving 'published' asks nothing of the content.
    expect((await setCourseStatus(teacher, draft.id, 'published')).publishedAt).toBe(
      published.publishedAt,
    );
    expect((await setCourseStatus(teacher, draft.id, 'archived')).status).toBe('archived');
  });
});
