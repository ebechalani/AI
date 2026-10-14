import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SYSTEM_ACTOR } from '@/lib/auth/actor';
import { createUserBadge, getBadge, listBadges, listUserBadges } from '@/lib/data/badges';
import {
  createCertificate,
  getCertificate,
  setCertificateRevoked,
  type NewCertificate,
} from '@/lib/data/certificates';
import { getCourse, listPublishedCoursesByPathway } from '@/lib/data/courses';
import {
  getEnrollment,
  markLessonEffectsApplied,
  setEnrollmentCertificate,
} from '@/lib/data/enrollments';
import { listProjects } from '@/lib/data/projects';
import { markAttemptEffectsApplied } from '@/lib/data/quizzes';
import { getSchool } from '@/lib/data/schools';
import { markSubmissionEffectsApplied } from '@/lib/data/submissions';
import { getUser } from '@/lib/data/users';
import { applyXpEntry } from '@/lib/data/xp';
import { NotFoundError } from '@/lib/errors';
import {
  issueCertificateFor,
  maybeIssueCourseCertificate,
  revokeCertificateById,
  SYSTEM_ISSUER,
} from '@/lib/gamification/certificates';
import { onLessonCompleted, onQuizPassed, onSubmissionAccepted } from '@/lib/gamification/events';
import { levelForXp } from '@/lib/gamification/levels';
import type {
  Badge,
  Certificate,
  Course,
  Enrollment,
  Project,
  School,
  SubmissionStatus,
  UserBadge,
  UserProfile,
  UserStats,
  XpReason,
} from '@/types';

// gamification/events and gamification/certificates over an in-memory stand-in for the
// repositories: what each handler awards, in which ledger entry, what it does when run again,
// and that `effectsApplied` is set last. The repositories themselves run against the emulator
// in tests/integration.

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(() => {
    throw new Error('Firestore was reached.');
  }),
}));
vi.mock('@/lib/data/badges', () => ({
  listBadges: vi.fn(),
  getBadge: vi.fn(),
  listUserBadges: vi.fn(),
  createUserBadge: vi.fn(),
}));
vi.mock('@/lib/data/xp', () => ({ applyXpEntry: vi.fn() }));
vi.mock('@/lib/data/courses', () => ({
  getCourse: vi.fn(),
  listPublishedCoursesByPathway: vi.fn(),
}));
vi.mock('@/lib/data/enrollments', () => ({
  getEnrollment: vi.fn(),
  setEnrollmentCertificate: vi.fn(),
  markLessonEffectsApplied: vi.fn(),
}));
vi.mock('@/lib/data/quizzes', () => ({ markAttemptEffectsApplied: vi.fn() }));
vi.mock('@/lib/data/submissions', () => ({ markSubmissionEffectsApplied: vi.fn() }));
vi.mock('@/lib/data/users', () => ({ getUser: vi.fn() }));
vi.mock('@/lib/data/schools', () => ({ getSchool: vi.fn() }));
vi.mock('@/lib/data/projects', () => ({ listProjects: vi.fn() }));
vi.mock('@/lib/data/certificates', () => ({
  createCertificate: vi.fn(),
  getCertificate: vi.fn(),
  setCertificateRevoked: vi.fn(),
}));

const UID = 'student-1';
const COURSE = 'course-1';
const CERTIFICATE_ID = `${UID}_${COURSE}`;
const NOW = '2026-10-02T08:00:00.000Z';

const STAT_OF_REASON: Partial<Record<XpReason, keyof UserStats>> = {
  lesson: 'lessonsCompleted',
  quiz: 'quizzesPassed',
  project: 'projectsAccepted',
  challenge: 'challengesCompleted',
};

interface World {
  user: UserProfile;
  ledger: Map<string, { amount: number; courseId: string | null }>;
  badges: Badge[];
  held: Set<string>;
  course: Course;
  enrollment: Enrollment | null;
  projects: Project[];
  certificate: Certificate | null;
  school: School | null;
  /** Every write, in order. */
  log: string[];
}

let world: World;

function badge(id: string, criteria: Badge['criteria'], xpBonus = 0): Badge {
  return {
    id,
    order: 0,
    icon: 'award',
    tier: 'bronze',
    criteria,
    xpBonus,
    isActive: true,
    defaultLocale: 'en',
    translations: { en: { name: id, description: id } },
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function project(id: string, fields: Partial<Project> = {}): Project {
  return {
    id,
    courseId: COURSE,
    lessonId: 'lesson-4',
    requiredForCertificate: true,
    ...fields,
  } as Project;
}

function submitted(projectId: string, latestStatus: SubmissionStatus): void {
  world.enrollment!.projectSummary[projectId] = {
    attempts: 1,
    latestSubmissionId: `${UID}_p_${COURSE}_${projectId}_1`,
    latestStatus,
  };
}

function completeCourse(): void {
  world.enrollment = { ...world.enrollment!, status: 'completed', completedAt: NOW };
  world.user.stats.coursesCompleted += 1;
}

beforeEach(() => {
  vi.clearAllMocks();
  world = {
    user: {
      id: UID,
      displayName: 'Maya K.',
      schoolId: 'school-a',
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
    } as UserProfile,
    ledger: new Map(),
    badges: [],
    held: new Set(),
    course: {
      id: COURSE,
      pathwayId: 'ai-explorer',
      isOfficial: true,
      certificateEnabled: true,
      translations: {
        en: { title: 'My First AI Adventure', summary: 's', description: 'd', outcomes: [] },
        fr: { title: 'Ma première aventure IA', summary: 's', description: 'd', outcomes: [] },
      },
    } as unknown as Course,
    enrollment: {
      id: CERTIFICATE_ID,
      userUid: UID,
      courseId: COURSE,
      schoolId: 'school-a',
      classId: 'class-a',
      status: 'active',
      completedAt: null,
      certificateId: null,
      quizSummary: {},
      projectSummary: {},
    } as unknown as Enrollment,
    projects: [],
    certificate: null,
    school: { id: 'school-a', name: 'Lycée Montaigne' } as School,
    log: [],
  };

  vi.mocked(applyXpEntry).mockImplementation(async (_actor, _uid, entry) => {
    const id = `${entry.reason}_${entry.refId}`;
    const statName = STAT_OF_REASON[entry.reason] ?? null;
    const { user } = world;
    const stat = () => (statName === null ? null : { name: statName, value: user.stats[statName] });
    if (world.ledger.has(id)) {
      return {
        created: false,
        xpTotal: user.xpTotal,
        level: user.level,
        previousLevel: user.level,
        stat: stat(),
      };
    }
    const previousLevel = user.level;
    world.ledger.set(id, { amount: entry.amount, courseId: entry.courseId });
    user.xpTotal += entry.amount;
    user.level = levelForXp(user.xpTotal);
    if (statName !== null) user.stats[statName] += 1;
    world.log.push(`xp ${id} +${entry.amount}`);
    return { created: true, xpTotal: user.xpTotal, level: user.level, previousLevel, stat: stat() };
  });
  vi.mocked(listBadges).mockImplementation(async () => world.badges);
  vi.mocked(getBadge).mockImplementation(async (_actor, id) =>
    world.badges.find((b) => b.id === id)!,
  );
  vi.mocked(listUserBadges).mockImplementation(async () =>
    [...world.held].map((badgeId) => ({ id: badgeId, uid: UID, badgeId }) as UserBadge),
  );
  vi.mocked(createUserBadge).mockImplementation(async (_actor, _uid, badgeId) => {
    if (world.held.has(badgeId)) return { created: false };
    world.held.add(badgeId);
    world.log.push(`badge ${badgeId}`);
    return { created: true };
  });
  vi.mocked(getCourse).mockImplementation(async () => world.course);
  vi.mocked(listPublishedCoursesByPathway).mockImplementation(async () => [world.course]);
  vi.mocked(getEnrollment).mockImplementation(async () => world.enrollment);
  vi.mocked(setEnrollmentCertificate).mockImplementation(async (_actor, _uid, _courseId, id) => {
    world.enrollment = { ...world.enrollment!, certificateId: id };
    world.log.push(`enrollment.certificateId ${id}`);
  });
  vi.mocked(markLessonEffectsApplied).mockImplementation(
    async (_actor, _uid, courseId, lessonId) => {
      world.log.push(`applied lesson ${courseId}/${lessonId}`);
    },
  );
  vi.mocked(markAttemptEffectsApplied).mockImplementation(async (_actor, attemptId) => {
    world.log.push(`applied attempt ${attemptId}`);
  });
  vi.mocked(markSubmissionEffectsApplied).mockImplementation(async (_actor, id, xpAwarded) => {
    world.log.push(`applied submission ${id} xp ${xpAwarded}`);
  });
  vi.mocked(getUser).mockImplementation(async () => structuredClone(world.user));
  vi.mocked(getSchool).mockImplementation(async (_actor, schoolId) => {
    if (world.school === null) throw new NotFoundError(`schools/${schoolId} does not exist.`);
    return world.school;
  });
  vi.mocked(listProjects).mockImplementation(async () => world.projects);
  vi.mocked(getCertificate).mockImplementation(async (_actor, id) => {
    if (world.certificate === null || world.certificate.id !== id) {
      throw new NotFoundError(`certificates/${id} does not exist.`);
    }
    return world.certificate;
  });
  vi.mocked(createCertificate).mockImplementation(async (_actor, input: NewCertificate) => {
    if (world.certificate?.status === 'issued')
      return { certificate: world.certificate, created: false };
    const reissued = world.certificate !== null;
    world.certificate = {
      ...input,
      id: `${input.userUid}_${input.courseId}`,
      type: 'course',
      verificationCode: reissued ? 'RH-BBBBBBBBBB' : 'RH-AAAAAAAAAA',
      status: 'issued',
      revokedReason: null,
      issuedAt: NOW,
      revokedAt: null,
      createdAt: NOW,
      updatedAt: NOW,
    };
    world.user.stats.certificates += 1;
    world.log.push(`certificate ${world.certificate.id} by ${input.issuedBy}`);
    return { certificate: world.certificate, created: true };
  });
  vi.mocked(setCertificateRevoked).mockImplementation(async (_actor, _id, reason) => {
    if (world.certificate!.status === 'revoked') return;
    world.certificate = {
      ...world.certificate!,
      status: 'revoked',
      revokedReason: reason,
      revokedAt: NOW,
    };
    world.user.stats.certificates -= 1;
    world.log.push(`revoked ${world.certificate.id}`);
  });
});

const lesson = (lessonId: string, courseCompleted = false) => ({
  courseId: COURSE,
  lessonId,
  xpReward: 50,
  courseCompleted,
});

describe('onLessonCompleted', () => {
  it('awards the lesson XP under a course-scoped ledger id and closes the lesson last', async () => {
    world.badges = [
      badge('first-lesson', { type: 'stat_threshold', stat: 'lessonsCompleted', threshold: 1 }),
    ];

    const outcome = await onLessonCompleted(UID, lesson('lesson-1'));

    expect(outcome).toEqual({
      xpAwarded: 50,
      xpTotal: 50,
      level: 1,
      leveledUp: false,
      newBadges: [world.badges[0]],
      certificate: null,
    });
    expect(world.ledger.get('lesson_course-1_lesson-1')).toEqual({ amount: 50, courseId: COURSE });
    expect(world.log).toEqual([
      'xp lesson_course-1_lesson-1 +50',
      'badge first-lesson',
      'applied lesson course-1/lesson-1',
    ]);
    // An ordinary lesson reads neither the course nor the profile.
    expect(getCourse).not.toHaveBeenCalled();
    expect(getUser).not.toHaveBeenCalled();
    expect(applyXpEntry).toHaveBeenCalledWith(SYSTEM_ACTOR, UID, expect.anything());
  });

  it('grants nothing a second time and still closes the lesson', async () => {
    await onLessonCompleted(UID, lesson('lesson-1'));
    world.log = [];

    expect(await onLessonCompleted(UID, lesson('lesson-1'))).toMatchObject({
      xpAwarded: 0,
      xpTotal: 50,
      leveledUp: false,
      newBadges: [],
    });
    expect(world.user.stats.lessonsCompleted).toBe(1);
    expect(world.log).toEqual(['applied lesson course-1/lesson-1']);
  });

  it('awards badges a first run missed when it is run again', async () => {
    await onLessonCompleted(UID, lesson('lesson-1'));
    world.badges = [
      badge('first-lesson', { type: 'stat_threshold', stat: 'lessonsCompleted', threshold: 1 }),
    ];

    const outcome = await onLessonCompleted(UID, lesson('lesson-1'));
    expect(outcome.xpAwarded).toBe(0);
    expect(outcome.newBadges.map((item) => item.id)).toEqual(['first-lesson']);
  });

  it('on the lesson that completes the course, awards course and pathway badges and the certificate', async () => {
    world.badges = [
      badge('course-done', { type: 'course_completed', courseId: COURSE }),
      badge('explorer', { type: 'pathway_completed', pathwayId: 'ai-explorer' }),
      badge('one-course', { type: 'stat_threshold', stat: 'coursesCompleted', threshold: 1 }),
      badge('other-course', { type: 'course_completed', courseId: 'course-2' }),
    ];
    completeCourse();

    const outcome = await onLessonCompleted(UID, lesson('lesson-4', true));

    expect(outcome.newBadges.map((item) => item.id)).toEqual([
      'course-done',
      'explorer',
      'one-course',
    ]);
    expect(outcome.certificate).toMatchObject({
      id: CERTIFICATE_ID,
      status: 'issued',
      issuedBy: 'system',
    });
    expect(world.enrollment?.certificateId).toBe(CERTIFICATE_ID);
    expect(world.log.at(-1)).toBe('applied lesson course-1/lesson-4');
  });

  it('counts badge bonuses in the outcome and reports the level they lead to', async () => {
    world.user.xpTotal = 100;
    world.badges = [
      badge('first-lesson', { type: 'stat_threshold', stat: 'lessonsCompleted', threshold: 1 }, 60),
    ];

    const outcome = await onLessonCompleted(UID, lesson('lesson-1'));

    // 100 + 50 stays in level 1; the bonus of 60 crosses the 200 XP of level 2.
    expect(outcome).toMatchObject({ xpAwarded: 110, xpTotal: 210, level: 2, leveledUp: true });
    expect(world.ledger.get('badge_first-lesson')).toEqual({ amount: 60, courseId: null });
  });

  it('leaves effectsApplied false when a step fails', async () => {
    vi.mocked(listBadges).mockRejectedValueOnce(new Error('unavailable'));
    await expect(onLessonCompleted(UID, lesson('lesson-1'))).rejects.toThrow('unavailable');
    expect(markLessonEffectsApplied).not.toHaveBeenCalled();
  });
});

describe('onQuizPassed', () => {
  const ctx = {
    attemptId: `${UID}_${COURSE}_quiz-1_2`,
    courseId: COURSE,
    quizId: 'quiz-1',
    xpReward: 100,
  };

  it('awards the quiz XP once per course and quiz, and closes the attempt', async () => {
    world.badges = [
      badge('quiz-fan', { type: 'stat_threshold', stat: 'quizzesPassed', threshold: 1 }),
    ];

    const outcome = await onQuizPassed(UID, ctx);

    expect(outcome).toMatchObject({ xpAwarded: 100, xpTotal: 100, certificate: null });
    expect(outcome.newBadges.map((item) => item.id)).toEqual(['quiz-fan']);
    expect(world.ledger.get('quiz_course-1_quiz-1')).toEqual({ amount: 100, courseId: COURSE });
    expect(world.log.at(-1)).toBe(`applied attempt ${ctx.attemptId}`);
  });

  it('grants nothing for passing the same quiz again', async () => {
    await onQuizPassed(UID, ctx);
    const again = await onQuizPassed(UID, { ...ctx, attemptId: `${UID}_${COURSE}_quiz-1_3` });

    expect(again).toMatchObject({ xpAwarded: 0, xpTotal: 100 });
    expect(world.user.stats.quizzesPassed).toBe(1);
    expect(markAttemptEffectsApplied).toHaveBeenLastCalledWith(
      SYSTEM_ACTOR,
      `${UID}_${COURSE}_quiz-1_3`,
    );
  });

  it('keeps the quizzes of two courses apart', async () => {
    await onQuizPassed(UID, ctx);
    const other = await onQuizPassed(UID, {
      ...ctx,
      courseId: 'course-2',
      attemptId: `${UID}_course-2_quiz-1_1`,
    });
    expect(other.xpAwarded).toBe(100);
    expect([...world.ledger.keys()]).toEqual(['quiz_course-1_quiz-1', 'quiz_course-2_quiz-1']);
  });
});

describe('onSubmissionAccepted', () => {
  const projectCtx = {
    submissionId: `${UID}_p_${COURSE}_project-1_1`,
    context: 'project' as const,
    refId: 'project-1',
    courseId: COURSE,
    xpReward: 300,
  };

  it('awards project XP under project_{courseId}_{projectId} and records it on the submission', async () => {
    const outcome = await onSubmissionAccepted(UID, projectCtx);

    expect(outcome).toMatchObject({
      xpAwarded: 300,
      xpTotal: 300,
      level: 2,
      leveledUp: true,
      certificate: null,
    });
    expect(world.ledger.get('project_course-1_project-1')).toEqual({
      amount: 300,
      courseId: COURSE,
    });
    expect(world.user.stats.projectsAccepted).toBe(1);
    expect(world.log.at(-1)).toBe(`applied submission ${projectCtx.submissionId} xp 300`);
  });

  it('issues the certificate when the project was the last thing missing', async () => {
    completeCourse();
    world.projects = [project('project-1')];
    submitted('project-1', 'approved');

    const outcome = await onSubmissionAccepted(UID, projectCtx);
    expect(outcome.certificate).toMatchObject({ id: CERTIFICATE_ID, status: 'issued' });
  });

  it('records the reward on the submission also when an interrupted run had granted it', async () => {
    await onSubmissionAccepted(UID, projectCtx);
    const again = await onSubmissionAccepted(UID, projectCtx);

    expect(again.xpAwarded).toBe(0);
    expect(markSubmissionEffectsApplied).toHaveBeenLastCalledWith(
      SYSTEM_ACTOR,
      projectCtx.submissionId,
      300,
    );
  });

  it('awards a challenge entry under challenge_{challengeId}, with no course and no certificate', async () => {
    const outcome = await onSubmissionAccepted(UID, {
      submissionId: `${UID}_c_challenge-1_1`,
      context: 'challenge',
      refId: 'challenge-1',
      courseId: null,
      xpReward: 500,
    });

    expect(outcome).toMatchObject({ xpAwarded: 500, certificate: null });
    expect(world.ledger.get('challenge_challenge-1')).toEqual({ amount: 500, courseId: null });
    expect(world.user.stats.challengesCompleted).toBe(1);
    expect(getCourse).not.toHaveBeenCalled();
  });

  it('refuses a project submission without its course', async () => {
    await expect(onSubmissionAccepted(UID, { ...projectCtx, courseId: null })).rejects.toThrow();
    expect(applyXpEntry).not.toHaveBeenCalled();
  });
});

describe('maybeIssueCourseCertificate', () => {
  beforeEach(completeCourse);

  it('issues with the snapshots of the learner, the course and the school', async () => {
    const certificate = await maybeIssueCourseCertificate(UID, COURSE);

    expect(createCertificate).toHaveBeenCalledExactlyOnceWith(SYSTEM_ACTOR, {
      userUid: UID,
      recipientName: 'Maya K.',
      courseId: COURSE,
      pathwayId: 'ai-explorer',
      courseTitle: {
        en: { title: 'My First AI Adventure' },
        fr: { title: 'Ma première aventure IA' },
      },
      isOfficial: true,
      schoolId: 'school-a',
      schoolName: 'Lycée Montaigne',
      issuedBy: SYSTEM_ISSUER.uid,
      issuerName: SYSTEM_ISSUER.name,
    });
    expect(certificate?.id).toBe(CERTIFICATE_ID);
    expect(setEnrollmentCertificate).toHaveBeenCalledExactlyOnceWith(
      SYSTEM_ACTOR,
      UID,
      COURSE,
      CERTIFICATE_ID,
    );
  });

  it('issues nothing when the course gives no certificate', async () => {
    world.course = { ...world.course, certificateEnabled: false };
    expect(await maybeIssueCourseCertificate(UID, COURSE)).toBeNull();
    expect(createCertificate).not.toHaveBeenCalled();
  });

  it('issues nothing before the enrollment is completed, or without an enrollment', async () => {
    world.enrollment = { ...world.enrollment!, status: 'active' };
    expect(await maybeIssueCourseCertificate(UID, COURSE)).toBeNull();
    world.enrollment = null;
    expect(await maybeIssueCourseCertificate(UID, COURSE)).toBeNull();
    expect(createCertificate).not.toHaveBeenCalled();
  });

  it('waits for every required project to be accepted', async () => {
    world.projects = [
      project('project-1'),
      project('project-2'),
      project('extra', { requiredForCertificate: false }),
    ];
    expect(await maybeIssueCourseCertificate(UID, COURSE)).toBeNull();

    submitted('project-1', 'approved');
    submitted('project-2', 'submitted');
    expect(await maybeIssueCourseCertificate(UID, COURSE)).toBeNull();

    submitted('project-2', 'returned');
    expect(await maybeIssueCourseCertificate(UID, COURSE)).toBeNull();

    // Accepted by the unsupervised flow counts like a teacher's approval.
    submitted('project-2', 'ai_reviewed');
    expect(await maybeIssueCourseCertificate(UID, COURSE)).not.toBeNull();
  });

  it('does not wait for a required project that no lesson links to', async () => {
    world.projects = [project('orphan', { lessonId: null })];
    expect(await maybeIssueCourseCertificate(UID, COURSE)).not.toBeNull();
  });

  it('answers null when the learner already holds the certificate', async () => {
    await maybeIssueCourseCertificate(UID, COURSE);
    vi.mocked(createCertificate).mockClear();

    expect(await maybeIssueCourseCertificate(UID, COURSE)).toBeNull();
    expect(createCertificate).not.toHaveBeenCalled();
    expect(world.user.stats.certificates).toBe(1);
  });

  it('finishes an issue that stopped before the enrollment was linked', async () => {
    await maybeIssueCourseCertificate(UID, COURSE);
    world.enrollment = { ...world.enrollment!, certificateId: null };

    const certificate = await maybeIssueCourseCertificate(UID, COURSE);
    expect(certificate?.verificationCode).toBe('RH-AAAAAAAAAA');
    expect(world.enrollment?.certificateId).toBe(CERTIFICATE_ID);
    expect(world.user.stats.certificates).toBe(1);
  });

  it('never brings back a revoked certificate by itself', async () => {
    await maybeIssueCourseCertificate(UID, COURSE);
    await revokeCertificateById(CERTIFICATE_ID, 'Issued by mistake', 'teacher-1');
    vi.mocked(createCertificate).mockClear();

    expect(await maybeIssueCourseCertificate(UID, COURSE)).toBeNull();
    expect(createCertificate).not.toHaveBeenCalled();
    expect(world.certificate?.status).toBe('revoked');
  });

  it('issues without a school name for an independent learner or a missing school', async () => {
    world.school = null;
    expect((await maybeIssueCourseCertificate(UID, COURSE))?.schoolName).toBeNull();

    world.certificate = null;
    world.enrollment = { ...world.enrollment!, schoolId: null, certificateId: null };
    vi.mocked(getSchool).mockClear();
    expect(await maybeIssueCourseCertificate(UID, COURSE)).toMatchObject({
      schoolId: null,
      schoolName: null,
    });
    expect(getSchool).not.toHaveBeenCalled();
  });
});

describe('issueCertificateFor', () => {
  const teacher = { uid: 'teacher-1', name: 'Ms. Haddad' };

  it('issues at the discretion of the caller, in the name of the issuer', async () => {
    world.projects = [project('project-1')];

    const certificate = await issueCertificateFor(UID, COURSE, teacher);
    expect(certificate).toMatchObject({
      status: 'issued',
      issuedBy: 'teacher-1',
      issuerName: 'Ms. Haddad',
    });
    expect(world.enrollment?.certificateId).toBe(CERTIFICATE_ID);
  });

  it('returns an issued certificate unchanged', async () => {
    const first = await issueCertificateFor(UID, COURSE, SYSTEM_ISSUER);
    const second = await issueCertificateFor(UID, COURSE, teacher);

    expect(second).toEqual(first);
    expect(world.user.stats.certificates).toBe(1);
    expect(setEnrollmentCertificate).toHaveBeenCalledTimes(1);
  });

  it('issues a revoked certificate again, with a new code', async () => {
    await issueCertificateFor(UID, COURSE, teacher);
    await revokeCertificateById(CERTIFICATE_ID, 'Wrong student', 'teacher-1');

    const again = await issueCertificateFor(UID, COURSE, teacher);
    expect(again).toMatchObject({ status: 'issued', verificationCode: 'RH-BBBBBBBBBB' });
    expect(world.enrollment?.certificateId).toBe(CERTIFICATE_ID);
    expect(world.user.stats.certificates).toBe(1);
  });

  it('needs an enrollment', async () => {
    world.enrollment = null;
    await expect(issueCertificateFor(UID, COURSE, teacher)).rejects.toMatchObject({
      code: 'not_found',
    });
    expect(createCertificate).not.toHaveBeenCalled();
  });
});

describe('revokeCertificateById', () => {
  it('revokes the certificate and unlinks it from the enrollment', async () => {
    await issueCertificateFor(UID, COURSE, SYSTEM_ISSUER);

    await revokeCertificateById(CERTIFICATE_ID, 'Issued by mistake', 'admin-1');

    expect(setCertificateRevoked).toHaveBeenCalledExactlyOnceWith(
      SYSTEM_ACTOR,
      CERTIFICATE_ID,
      'Issued by mistake',
    );
    expect(world.certificate).toMatchObject({
      status: 'revoked',
      revokedReason: 'Issued by mistake',
    });
    expect(world.enrollment?.certificateId).toBeNull();
    expect(world.user.stats.certificates).toBe(0);
  });

  it('can be repeated, and finishes a revocation that stopped before the unlinking', async () => {
    await issueCertificateFor(UID, COURSE, SYSTEM_ISSUER);
    await revokeCertificateById(CERTIFICATE_ID, 'Issued by mistake', 'admin-1');
    world.enrollment = { ...world.enrollment!, certificateId: CERTIFICATE_ID };

    await revokeCertificateById(CERTIFICATE_ID, 'Issued by mistake', 'admin-1');
    expect(world.enrollment?.certificateId).toBeNull();
    expect(world.user.stats.certificates).toBe(0);
  });

  it('fails with not_found for an unknown certificate', async () => {
    await expect(revokeCertificateById('nobody_course-9', 'x', 'admin-1')).rejects.toMatchObject({
      code: 'not_found',
    });
    expect(setCertificateRevoked).not.toHaveBeenCalled();
  });
});
