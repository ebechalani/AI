import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  listAllLicenses,
  listLicensesForSchool,
  upsertLicense,
  upsertSubscription,
} from '@/lib/data/billing';
import {
  getChallenge,
  listChallengesForUser,
  setChallengeStatus,
  upsertChallenge,
} from '@/lib/data/challenges';
import { listSchools } from '@/lib/data/schools';
import { getSubmission, listSubmissionsForChallenge } from '@/lib/data/submissions';
import {
  ConflictError,
  ForbiddenError,
  LicenseRequiredError,
  NotFoundError,
  ValidationError,
} from '@/lib/errors';
import { getAdminAuth } from '@/lib/firebase/admin';
import { collections, docIds } from '@/lib/firebase/collections';
import { getCourseAccess } from '@/lib/services/access';
import { assignCourseToClass, createClass } from '@/lib/services/classroom';
import { enrollSelf } from '@/lib/services/learning';
import { generateAiReview, getSubmissionForViewer, submitWork } from '@/lib/services/project-flow';
import {
  completeSignup,
  createSchoolWithAdmin,
  createTeacher,
  provisionStudents,
  setVerifiedEducator,
} from '@/lib/services/provisioning';
import type {
  ChallengeInput,
  LicenseInput,
  School,
  Session,
  SubmissionTarget,
  UserProfile,
} from '@/types';
import { resetEmulators, seedEmulators, signUpWithPassword } from './support/emulators';
import {
  buildOfficialCourse,
  CLEAN_STORY,
  CLIENT_KEY,
  DEMO_UID,
  demoEmail,
  ledgerIds,
  profileOf,
  readSeedState,
  refusal,
  sessionFor,
  sessionOf,
  STORY_WITH_EMAIL,
  STORY_WITH_INJECTION,
  textWork,
  type BuiltCourse,
  type SeedState,
} from './support/world';

// The platform admin flow of ARCHITECTURE.md 11.1: a school with its first admin, the licence
// that opens premium content to it, the verified-educator flag, and a challenge that an
// independent learner enters.

vi.mock('@/lib/auth/session', () => ({ setSessionCookie: vi.fn(), clearSessionCookie: vi.fn() }));

const DAY_MS = 24 * 60 * 60 * 1000;
const daysFromNow = (days: number): string => new Date(Date.now() + days * DAY_MS).toISOString();

const RUBRIC = [
  { key: 'creativity' as const, weight: 25 },
  { key: 'technicalQuality' as const, weight: 25 },
  { key: 'understanding' as const, weight: 25 },
  { key: 'responsibleAi' as const, weight: 25 },
];

describe('platform admin flow: schools, licences, educators and challenges', () => {
  let state: SeedState;
  let admin: Session;
  let solo: Session;
  let premium: BuiltCourse;
  let free: BuiltCourse;
  let beta: { school: School; admin: UserProfile };
  let betaAdmin: Session;
  let betaTeacher: Session;
  let pupil: Session;
  let betaClassId: string;

  beforeAll(async () => {
    await resetEmulators();
    seedEmulators();
    state = await readSeedState();
    admin = await sessionFor(DEMO_UID.admin);
    const { idToken } = await signUpWithPassword('solo.learner@example.test', 'signup-password-1');
    solo = sessionOf(
      await completeSignup(
        idToken,
        {
          displayName: 'Solo Learner',
          role: 'student',
          ageBand: '16-18',
          locale: 'en',
          acceptedTerms: true,
        },
        { clientKey: CLIENT_KEY },
      ),
    );
    premium = await buildOfficialCourse(admin, { title: 'Premium course', accessTier: 'premium' });
    free = await buildOfficialCourse(admin, { title: 'Free course' });
  }, 240_000);

  it('createSchoolWithAdmin: the school, then its admin, who is not a seat', async () => {
    const schoolsBefore = (await listSchools(admin)).items.length;
    beta = await createSchoolWithAdmin(admin, {
      school: { name: 'Beta School', country: 'lb', city: 'Tripoli', defaultLocale: 'fr' },
      adminDisplayName: 'Beta Admin',
      adminEmail: 'Admin@Beta.Test',
    });
    expect(beta.school).toMatchObject({
      name: 'Beta School',
      country: 'LB',
      city: 'Tripoli',
      defaultLocale: 'fr',
      status: 'active',
      settings: { aiEnabled: true, aiDailyMessageLimit: null, joinCodesEnabled: true },
      counts: { teachers: 0, students: 0, classes: 0 },
      createdByUid: admin.uid,
    });
    expect(beta.admin).toMatchObject({
      role: 'school_admin',
      schoolId: beta.school.id,
      displayName: 'Beta Admin',
      email: 'admin@beta.test',
      username: null,
      locale: 'fr',
      ageBand: 'adult',
      consentBasis: 'adult',
      provisionedByUid: admin.uid,
    });
    const authUser = await getAdminAuth().getUser(beta.admin.id);
    expect(authUser.emailVerified).toBe(false);
    expect(authUser.passwordHash).toBeUndefined();
    expect(authUser.customClaims).toEqual({ role: 'school_admin', schoolId: beta.school.id });
    expect((await listSchools(admin)).items.length).toBe(schoolsBefore + 1);
    betaAdmin = await sessionFor(beta.admin.id);

    // An address that already has an account leaves no school behind.
    await refusal(
      createSchoolWithAdmin(admin, {
        school: { name: 'Gamma School', country: 'LB', city: null, defaultLocale: 'en' },
        adminDisplayName: 'Gamma Admin',
        adminEmail: demoEmail('teacher'),
      }),
      ConflictError,
    );
    expect((await listSchools(admin)).items.length).toBe(schoolsBefore + 1);

    const badSchool = await refusal(
      createSchoolWithAdmin(admin, {
        school: { name: 'G', country: 'Lebanon', city: null, defaultLocale: 'en' },
        adminDisplayName: 'Gamma Admin',
        adminEmail: 'admin@gamma.test',
      }),
      ValidationError,
    );
    expect(badSchool.fieldErrors).toEqual({
      'school.name': ['too_short'],
      'school.country': ['invalid'],
    });
    const badAdmin = await refusal(
      createSchoolWithAdmin(admin, {
        school: { name: 'Gamma School', country: 'LB', city: null, defaultLocale: 'en' },
        adminDisplayName: 'G',
        adminEmail: 'nope',
      }),
      ValidationError,
    );
    expect(badAdmin.fieldErrors).toEqual({
      adminDisplayName: ['display_name_length'],
      adminEmail: ['invalid_email'],
    });
    await refusal(
      createSchoolWithAdmin(betaAdmin, {
        school: { name: 'Gamma School', country: 'LB', city: null, defaultLocale: 'en' },
        adminDisplayName: 'Gamma Admin',
        adminEmail: 'admin@gamma.test',
      }),
      ForbiddenError,
    );
  });

  it('upsertLicense opens a premium course to the school; getCourseAccess names the ground', async () => {
    const teacherProfile = await createTeacher(admin, {
      displayName: 'Beta Teacher',
      email: 'teacher@beta.test',
      schoolId: beta.school.id,
    });
    expect(teacherProfile.locale).toBe('fr');
    betaTeacher = await sessionFor(teacherProfile.id);
    const betaClass = await createClass(betaTeacher, {
      name: 'Beta 1',
      gradeLabel: null,
      ageBand: '11-12',
    });
    betaClassId = betaClass.id;
    const [pupilAccount] = await provisionStudents(betaTeacher, betaClassId, [
      { displayName: 'Pupil One' },
    ]);
    pupil = await sessionFor(pupilAccount!.uid);
    expect(pupil.locale).toBe('fr');

    const noLicence = { allowed: false, reason: 'license_required' };
    expect(await getCourseAccess(betaTeacher, premium.course)).toEqual(noLicence);
    expect(await getCourseAccess(pupil, premium.course)).toEqual(noLicence);
    expect(await getCourseAccess(betaAdmin, premium.course)).toEqual(noLicence);
    expect(await getCourseAccess(solo, premium.course)).toEqual(noLicence);
    expect(await getCourseAccess(admin, premium.course)).toEqual({ allowed: true, via: 'owner' });
    expect(await getCourseAccess(pupil, free.course)).toEqual({ allowed: true, via: 'free' });
    expect(await getCourseAccess(betaTeacher, free.course)).toEqual({
      allowed: true,
      via: 'staff_preview',
    });
    await refusal(enrollSelf(pupil, premium.course.id), LicenseRequiredError);
    await refusal(
      assignCourseToClass(betaTeacher, betaClassId, premium.course.id, null),
      LicenseRequiredError,
    );

    const input: LicenseInput = {
      schoolId: beta.school.id,
      subscriptionId: null,
      name: 'Beta annual licence',
      seatsTotal: 30,
      scope: { type: 'all_official' },
      startsAt: daysFromNow(-1),
      endsAt: daysFromNow(30),
      status: 'active',
    };
    await refusal(upsertLicense(betaAdmin, null, input), ForbiddenError);
    await refusal(
      upsertLicense(admin, null, { ...input, schoolId: 'no-such-school' }),
      NotFoundError,
    );
    const badDates = await refusal(
      upsertLicense(admin, null, { ...input, endsAt: input.startsAt }),
      ValidationError,
    );
    expect(badDates.fieldErrors).toEqual({ endsAt: ['date_order'] });

    const license = await upsertLicense(admin, null, input);
    expect(license).toMatchObject({
      schoolId: beta.school.id,
      name: input.name,
      seatsTotal: 30,
      scope: { type: 'all_official' },
      status: 'active',
      createdByUid: admin.uid,
    });
    expect((await listLicensesForSchool(betaAdmin, beta.school.id)).map((item) => item.id)).toEqual(
      [license.id],
    );
    expect(await getCourseAccess(betaTeacher, premium.course)).toEqual({
      allowed: true,
      via: 'license',
    });
    expect(await getCourseAccess(pupil, premium.course)).toEqual({ allowed: true, via: 'license' });
    expect(await getCourseAccess(betaAdmin, premium.course)).toEqual({
      allowed: true,
      via: 'license',
    });

    // Assigned while covered; when the licence lapses the pupil keeps the course through the class.
    await assignCourseToClass(betaTeacher, betaClassId, premium.course.id, null);
    await upsertLicense(admin, license.id, { ...input, status: 'suspended' });
    expect(await getCourseAccess(betaTeacher, premium.course)).toEqual(noLicence);
    expect(await getCourseAccess(pupil, premium.course)).toEqual({
      allowed: true,
      via: 'class_assignment',
    });
    // A licence scoped to other pathways covers nothing here; one naming the pathway does.
    await upsertLicense(admin, license.id, {
      ...input,
      scope: { type: 'pathways', pathwayIds: ['ai-explorer'] },
    });
    expect(await getCourseAccess(betaTeacher, premium.course)).toEqual(noLicence);
    await upsertLicense(admin, license.id, {
      ...input,
      scope: { type: 'pathways', pathwayIds: [premium.course.pathwayId!] },
    });
    expect(await getCourseAccess(betaTeacher, premium.course)).toEqual({
      allowed: true,
      via: 'license',
    });

    // An individual learner buys a plan instead.
    await upsertSubscription(admin, null, {
      ownerType: 'user',
      ownerId: solo.uid,
      plan: 'individual_monthly',
      status: 'active',
      currentPeriodStart: daysFromNow(-1),
      currentPeriodEnd: daysFromNow(29),
      courseIds: [],
      notes: null,
    });
    expect(await getCourseAccess(solo, premium.course)).toEqual({
      allowed: true,
      via: 'subscription',
    });
    expect((await enrollSelf(solo, premium.course.id)).source).toBe('self');
  });

  it('listAllLicenses: the licences of every school, latest end first, paged by licence id', async () => {
    const base: LicenseInput = {
      schoolId: beta.school.id,
      subscriptionId: null,
      name: 'Beta, renewal',
      seatsTotal: 5,
      scope: { type: 'all_official' },
      startsAt: daysFromNow(3000),
      endsAt: daysFromNow(4000),
      status: 'suspended',
    };
    // Suspended and far in the future: they cover nothing, and they sort above every other.
    const betaLater = await upsertLicense(admin, null, base);
    const demoLatest = await upsertLicense(admin, null, {
      ...base,
      schoolId: state.schoolId,
      name: 'Demo school, renewal',
      endsAt: daysFromNow(5000),
    });

    const all = await listAllLicenses(admin, { limit: 100 });
    expect(all.nextCursor).toBeNull();
    expect(all.items.slice(0, 2).map((license) => license.id)).toEqual([
      demoLatest.id,
      betaLater.id,
    ]);
    const ends = all.items.map((license) => Date.parse(license.endsAt));
    expect(ends).toEqual([...ends].sort((a, b) => b - a));
    expect(new Set(all.items.map((license) => license.schoolId))).toEqual(
      new Set([state.schoolId, beta.school.id]),
    );
    expect(all.items.map((license) => license.id)).toEqual(
      expect.arrayContaining([state.licenseId]),
    );

    const first = await listAllLicenses(admin, { limit: 1 });
    expect(first.items.map((license) => license.id)).toEqual([demoLatest.id]);
    expect(first.nextCursor).toBe(demoLatest.id);
    const second = await listAllLicenses(admin, { limit: 1, cursor: first.nextCursor! });
    expect(second.items.map((license) => license.id)).toEqual([betaLater.id]);

    for (const cursor of ['no-such-license', beta.school.id]) {
      const error = await refusal(listAllLicenses(admin, { limit: 1, cursor }), ValidationError);
      expect(error.fieldErrors).toEqual({ cursor: ['invalid'] });
    }
    await refusal(listAllLicenses(betaAdmin), ForbiddenError);
  });

  it('setVerifiedEducator: platform admins flag teachers, with an audit entry', async () => {
    expect((await profileOf(betaTeacher.uid)).verifiedEducator).toBe(false);
    await setVerifiedEducator(admin, betaTeacher.uid, true);
    expect((await profileOf(betaTeacher.uid)).verifiedEducator).toBe(true);
    const audits = await collections
      .auditLogs()
      .where('action', '==', 'user.educator_verified')
      .where('targetId', '==', betaTeacher.uid)
      .get();
    expect(audits.size).toBe(1);
    expect(audits.docs[0]!.get('meta')).toEqual({ verified: true });
    expect(audits.docs[0]!.get('schoolId')).toBe(beta.school.id);

    await setVerifiedEducator(admin, betaTeacher.uid, false);
    expect((await profileOf(betaTeacher.uid)).verifiedEducator).toBe(false);
    await refusal(setVerifiedEducator(admin, pupil.uid, true), ConflictError);
    await refusal(setVerifiedEducator(admin, 'no-such-user', true), NotFoundError);
    await refusal(setVerifiedEducator(betaAdmin, betaTeacher.uid, true), ForbiddenError);
    await refusal(setVerifiedEducator(betaTeacher, betaTeacher.uid, true), ForbiddenError);
  });

  it('upsertChallenge and a challenge entry: published, entered, returned, entered again, accepted', async () => {
    const input: ChallengeInput = {
      type: 'weekly',
      scope: 'global',
      schoolId: null,
      area: 'creativity',
      ageMin: 8,
      ageMax: 18,
      startAt: daysFromNow(-1),
      deadlineAt: daysFromNow(6),
      allowedSubmissionTypes: ['text', 'link'],
      rubric: RUBRIC,
      xpReward: 400,
      coverImageFileId: null,
      hardwarePlatformIds: [],
      requiredCapabilities: [],
      defaultLocale: 'en',
      translations: {
        en: {
          title: 'Poster week',
          description: 'Make a poster about AI around you.',
          submissionRequirements: 'Describe your poster as text.',
          prizes: null,
        },
      },
    };
    await refusal(upsertChallenge(betaAdmin, null, input), ForbiddenError);
    const scoped = await refusal(
      upsertChallenge(admin, null, { ...input, scope: 'school', schoolId: null }),
      ValidationError,
    );
    expect(scoped.fieldErrors).toEqual({ schoolId: ['required'] });

    const draft = await upsertChallenge(admin, null, input);
    expect(draft).toMatchObject({
      status: 'draft',
      submissionCount: 0,
      createdByUid: admin.uid,
      xpReward: 400,
      coverImage: null,
    });
    const target: SubmissionTarget = { context: 'challenge', challengeId: draft.id };
    await refusal(getChallenge(solo, draft.id), NotFoundError);
    await refusal(submitWork(solo, textWork(target)), NotFoundError);

    await setChallengeStatus(admin, draft.id, 'published');
    const challenge = await getChallenge(solo, draft.id);
    expect(challenge.status).toBe('published');
    expect(
      (await listChallengesForUser(solo, { upcomingOrOpenOnly: true })).map((item) => item.id),
    ).toContain(challenge.id);

    // An entry that addresses the grader: the unsupervised flow returns it. The count is per student.
    const first = await submitWork(solo, textWork(target, STORY_WITH_INJECTION));
    expect(first).toMatchObject({
      id: docIds.challengeSubmission(solo.uid, challenge.id, 1),
      context: 'challenge',
      courseId: null,
      lessonId: null,
      projectId: null,
      challengeId: challenge.id,
      classId: null,
      attemptNumber: 1,
      status: 'submitted',
      rubric: RUBRIC,
    });
    expect(first.contextTitle.en?.title).toBe('Poster week');
    expect((await getChallenge(admin, challenge.id)).submissionCount).toBe(1);
    await generateAiReview(first.id);
    const returned = await getSubmissionForViewer(solo, first.id);
    expect(returned.submission).toMatchObject({
      status: 'returned',
      aiReviewStatus: 'ready',
      reviewedByUid: null,
      xpAwarded: 0,
    });
    expect(returned.aiReview?.flags).toContain('possible_prompt_injection');

    await refusal(
      submitWork(solo, textWork(target, CLEAN_STORY, { previousSubmissionId: 'stale' })),
      ConflictError,
    );
    // An address only flags the work (it blocks a teacher's one-click approval); alone, it does
    // not reject in the unsupervised flow.
    const second = await submitWork(
      solo,
      textWork(target, STORY_WITH_EMAIL, { previousSubmissionId: first.id }),
    );
    expect(second).toMatchObject({ attemptNumber: 2, previousSubmissionId: first.id });
    expect((await getChallenge(admin, challenge.id)).submissionCount).toBe(1);
    await generateAiReview(second.id);
    const accepted = await getSubmissionForViewer(solo, second.id);
    expect(accepted.submission).toMatchObject({
      status: 'ai_reviewed',
      effectsApplied: true,
      xpAwarded: 400,
    });
    expect(accepted.aiReview?.flags).toEqual(['possible_personal_data']);
    expect(await getSubmission(solo, second.id)).toMatchObject({ status: 'ai_reviewed' });
    expect(await ledgerIds(solo.uid)).toContain(docIds.xpEntry('challenge', challenge.id));
    const profile = await profileOf(solo.uid);
    expect(profile.xpTotal).toBe(400);
    expect(profile.stats.challengesCompleted).toBe(1);
    // An accepted entry is final.
    await refusal(
      submitWork(solo, textWork(target, CLEAN_STORY, { previousSubmissionId: second.id })),
      ConflictError,
    );
    const wrongType = await refusal(
      submitWork(
        solo,
        textWork(target, CLEAN_STORY, {
          type: 'code',
          content: { text: null, linkUrl: null, code: 'print(1)', codeLanguage: 'python' },
        }),
      ),
      ValidationError,
    );
    expect(wrongType.fieldErrors).toEqual({ type: ['invalid_choice'] });

    // The seed's robotics challenge has not started yet.
    const upcoming = state.challengeIds['robotics-line-follower']!;
    await refusal(
      submitWork(solo, textWork({ context: 'challenge', challengeId: upcoming })),
      ConflictError,
    );

    const updated = await upsertChallenge(admin, challenge.id, { ...input, xpReward: 450 });
    expect(updated).toMatchObject({ status: 'published', submissionCount: 1, xpReward: 450 });
    const entries = await listSubmissionsForChallenge(admin, challenge.id);
    expect(entries.items.map((entry) => entry.id).sort()).toEqual([first.id, second.id].sort());
    await refusal(listSubmissionsForChallenge(solo, challenge.id), ForbiddenError);
    await refusal(setChallengeStatus(betaAdmin, challenge.id, 'archived'), ForbiddenError);
  });
});
