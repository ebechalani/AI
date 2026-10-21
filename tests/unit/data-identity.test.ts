import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SYSTEM_ACTOR, type Actor } from '@/lib/auth/actor';
import { checkAndCountAiUsage } from '@/lib/data/ai-usage';
import { AUDIT_ACTIONS } from '@/lib/data/audit';
import * as badges from '@/lib/data/badges';
import * as billing from '@/lib/data/billing';
import * as certificates from '@/lib/data/certificates';
import * as challenges from '@/lib/data/challenges';
import * as classes from '@/lib/data/classes';
import * as files from '@/lib/data/files';
import { clampAiDailyMessageLimit, clampLimit } from '@/lib/data/internal-identity';
import * as pathways from '@/lib/data/pathways';
import { consumeRateLimit } from '@/lib/data/rate-limit';
import * as schools from '@/lib/data/schools';
import * as users from '@/lib/data/users';
import * as xp from '@/lib/data/xp';
import { getAdminDb } from '@/lib/firebase/admin';
import type {
  ChallengeInput,
  FileRecord,
  LicenseInput,
  Role,
  Session,
  SubscriptionInput,
  UserProfile,
} from '@/types';

// The repositories of users, schools, classes, pathways, files, badges, XP, certificates,
// challenges, billing, AI usage and rate limits, with Firestore taken away: any call that
// reaches it fails the test. What is left to observe is what must happen before the first read
// or write: the authorization that needs no document, and the answer to a malformed id.
// What the repositories do with documents is covered against the emulator (tests/integration).

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(() => {
    throw new Error('Firestore was reached.');
  }),
}));

function session(role: Role, schoolId: string | null = null, classIds: string[] = []): Session {
  return {
    uid: `${role}-1`,
    role,
    schoolId,
    classIds,
    displayName: 'Test User',
    locale: 'en',
    ageBand: 'adult',
    avatarId: 'robot',
    verifiedEducator: false,
  };
}

const platformAdmin = session('platform_admin');
const schoolAdmin = session('school_admin', 'school-a');
const teacher = session('teacher', 'school-a', ['class-a']);
const student = session('student', 'school-a', ['class-a']);
const everyone = [platformAdmin, schoolAdmin, teacher, student];

const FILE_ID = '0b5f1c1e-7a3d-4a52-9d0e-3c1f6f1f2a10';
const profile = { id: 'student-1' } as UserProfile;

const licenseInput: LicenseInput = {
  schoolId: 'school-a',
  subscriptionId: null,
  name: 'Licence',
  seatsTotal: 10,
  scope: { type: 'all_official' },
  startsAt: '2026-01-01T00:00:00.000Z',
  endsAt: '2027-01-01T00:00:00.000Z',
  status: 'active',
};
const subscriptionInput: SubscriptionInput = {
  ownerType: 'school',
  ownerId: 'school-a',
  plan: 'school_annual',
  status: 'active',
  currentPeriodStart: '2026-01-01T00:00:00.000Z',
  currentPeriodEnd: '2027-01-01T00:00:00.000Z',
  courseIds: [],
  notes: null,
};
const challengeInput = { scope: 'global', schoolId: null } as ChallengeInput;

async function errorCode(call: () => Promise<unknown>): Promise<string> {
  try {
    await call();
    return 'resolved';
  } catch (error) {
    return (error as { code?: string }).code ?? `thrown: ${String(error)}`;
  }
}

beforeEach(() => {
  vi.mocked(getAdminDb).mockClear();
});

describe('system-only functions', () => {
  const systemOnly: Record<string, (actor: Actor) => Promise<unknown>> = {
    'users.createUserProfile': (actor) =>
      users.createUserProfile(actor, 'student-1', {
        role: 'student',
        schoolId: null,
        displayName: 'Maya K.',
        username: 'maya.k',
        email: null,
        ageBand: '11-12',
        locale: 'en',
        consentBasis: 'school',
        provisionedByUid: null,
      }),
    'users.setIdentity': (actor) => users.setIdentity(actor, 'student-1', { role: 'teacher' }),
    'users.setSessionsValidAfter': (actor) =>
      users.setSessionsValidAfter(actor, 'student-1', new Date()),
    'users.touchLastLogin': (actor) => users.touchLastLogin(actor, 'student-1'),
    'schools.adjustSchoolCounts': (actor) =>
      schools.adjustSchoolCounts(actor, 'school-a', { students: 1 }),
    'classes.findClassByJoinCode': (actor) => classes.findClassByJoinCode(actor, 'ABCDEFGH'),
    'classes.createClass': (actor) =>
      classes.createClass(actor, {
        schoolId: 'school-a',
        name: 'Grade 6',
        gradeLabel: null,
        ageBand: '11-12',
        ownerUid: 'teacher-1',
      }),
    'classes.setTeachers': (actor) => classes.setTeachers(actor, 'class-a', ['teacher-1']),
    'classes.addMember': (actor) => classes.addMember(actor, 'class-a', profile, null),
    'classes.removeMember': (actor) => classes.removeMember(actor, 'class-a', 'student-1'),
    'classes.removeUserFromAllClasses': (actor) =>
      classes.removeUserFromAllClasses(actor, 'student-1'),
    'files.registerFile': (actor) =>
      files.registerFile(actor, {
        id: FILE_ID,
        ownerUid: 'student-1',
        schoolId: null,
        purpose: 'submission',
        kind: 'image',
        storagePath: `user-uploads/student-1/image/${FILE_ID}/a.png`,
        fileName: 'a.png',
        contentType: 'image/png',
        sizeBytes: 1,
        width: null,
        height: null,
        courseId: null,
      }),
    'files.attachFilesToSubmission': (actor) =>
      files.attachFilesToSubmission(actor, [FILE_ID], 'student-1_c_challenge-1_1'),
    'files.deleteFile': (actor) => files.deleteFile(actor, FILE_ID),
    'badges.createUserBadge': (actor) =>
      badges.createUserBadge(actor, 'student-1', 'ai-explorer', 'system', null),
    'certificates.createCertificate': (actor) =>
      certificates.createCertificate(actor, {
        userUid: 'student-1',
        recipientName: 'Maya K.',
        courseId: 'course-1',
        pathwayId: null,
        courseTitle: { en: { title: 'Course' } },
        isOfficial: true,
        schoolId: null,
        schoolName: null,
        issuedBy: 'system',
        issuerName: 'RoboHolic',
      }),
    'certificates.setCertificateRevoked': (actor) =>
      certificates.setCertificateRevoked(actor, 'student-1_course-1', 'reason'),
    'xp.applyXpEntry': (actor) =>
      xp.applyXpEntry(actor, 'student-1', {
        reason: 'adjustment',
        refId: 'log-1',
        amount: 100_000,
        courseId: null,
      }),
  };

  it.each(Object.keys(systemOnly))('%s refuses every session', async (name) => {
    for (const actor of everyone) {
      expect(await errorCode(() => systemOnly[name]!(actor))).toBe('forbidden');
    }
    expect(getAdminDb).not.toHaveBeenCalled();
  });

  it('lets the system through to Firestore', async () => {
    for (const name of Object.keys(systemOnly)) {
      expect(await errorCode(() => systemOnly[name]!(SYSTEM_ACTOR)), name).toBe(
        'thrown: Error: Firestore was reached.',
      );
    }
  });

  it('checks what the system hands over before the first write', async () => {
    const newProfile = {
      role: 'student',
      schoolId: null,
      displayName: 'Maya K.',
      username: 'maya.k',
      email: null,
      ageBand: '11-12',
      locale: 'en',
      consentBasis: 'school',
      provisionedByUid: null,
    } as const;
    expect(
      await errorCode(() =>
        users.createUserProfile(SYSTEM_ACTOR, 'student-1', { ...newProfile, avatarId: 'unicorn' }),
      ),
    ).toBe('validation');
    expect(
      await errorCode(() =>
        users.createUserProfile(SYSTEM_ACTOR, 'student-1', { ...newProfile, role: 'root' as Role }),
      ),
    ).toBe('validation');

    const entry = { refId: 'course-1_lesson-1', amount: 50, courseId: 'course-1' };
    await expect(
      xp.applyXpEntry(SYSTEM_ACTOR, 'student-1', { ...entry, reason: 'toString' as never }),
    ).rejects.toThrow(/reason/);
    await expect(
      xp.applyXpEntry(SYSTEM_ACTOR, 'student-1', { ...entry, reason: 'lesson', amount: 12.5 }),
    ).rejects.toThrow(/whole number/);
    expect(getAdminDb).not.toHaveBeenCalled();
  });
});

describe('platform-admin functions', () => {
  const adminOnly: Record<string, (actor: Actor) => Promise<unknown>> = {
    'users.listUsersByRole': (actor) => users.listUsersByRole(actor, 'teacher'),
    'users.setVerifiedEducator': (actor) => users.setVerifiedEducator(actor, 'teacher-1', true),
    'schools.listSchools': (actor) => schools.listSchools(actor),
    'schools.createSchool': (actor) =>
      schools.createSchool(actor, {
        name: 'A School',
        country: 'LB',
        city: null,
        defaultLocale: 'en',
      }),
    'schools.setSchoolStatus': (actor) => schools.setSchoolStatus(actor, 'school-a', 'suspended'),
    'schools.updateSchool (country)': (actor) =>
      schools.updateSchool(actor, 'school-a', { country: 'FR' }),
    'pathways.listPathways': (actor) => pathways.listPathways(actor),
    'certificates.listAllCertificates': (actor) => certificates.listAllCertificates(actor),
    'challenges.listAllChallenges': (actor) => challenges.listAllChallenges(actor),
    'challenges.upsertChallenge': (actor) =>
      challenges.upsertChallenge(actor, null, challengeInput),
    'challenges.setChallengeStatus': (actor) =>
      challenges.setChallengeStatus(actor, 'challenge-1', 'published'),
    'billing.upsertLicense': (actor) => billing.upsertLicense(actor, null, licenseInput),
    'billing.listAllLicenses': (actor) => billing.listAllLicenses(actor),
    'billing.listSubscriptions': (actor) => billing.listSubscriptions(actor),
    'billing.upsertSubscription': (actor) =>
      billing.upsertSubscription(actor, null, subscriptionInput),
  };

  it.each(Object.keys(adminOnly))('%s refuses the other roles', async (name) => {
    for (const actor of [schoolAdmin, teacher, student]) {
      expect(await errorCode(() => adminOnly[name]!(actor))).toBe('forbidden');
    }
    expect(getAdminDb).not.toHaveBeenCalled();
  });
});

describe('school-scoped functions', () => {
  const inSchoolA: Record<string, (actor: Actor) => Promise<unknown>> = {
    'users.listSchoolUsers': (actor) => users.listSchoolUsers(actor, 'school-a', 'student'),
    'schools.updateSchool': (actor) => schools.updateSchool(actor, 'school-a', { name: 'New' }),
    'classes.listClassesForSchool': (actor) => classes.listClassesForSchool(actor, 'school-a'),
    'certificates.listCertificatesForSchool': (actor) =>
      certificates.listCertificatesForSchool(actor, 'school-a'),
    'billing.listLicensesForSchool': (actor) => billing.listLicensesForSchool(actor, 'school-a'),
    'billing.listSubscriptionsForOwner (school)': (actor) =>
      billing.listSubscriptionsForOwner(actor, 'school', 'school-a'),
  };

  it.each(Object.keys(inSchoolA))(
    '%s is for the admin of that school, not for its members or another school',
    async (name) => {
      const outsiders = [session('school_admin', 'school-b'), teacher, student];
      for (const actor of outsiders) {
        expect(await errorCode(() => inSchoolA[name]!(actor))).toBe('forbidden');
      }
      expect(getAdminDb).not.toHaveBeenCalled();
      expect(await errorCode(() => inSchoolA[name]!(schoolAdmin))).toBe(
        'thrown: Error: Firestore was reached.',
      );
    },
  );

  it('a school is visible to its members only', async () => {
    expect(
      await errorCode(() => schools.getSchool(session('teacher', 'school-b'), 'school-a')),
    ).toBe('forbidden');
    expect(await errorCode(() => schools.getSchool(session('student'), 'school-a'))).toBe(
      'forbidden',
    );
    expect(getAdminDb).not.toHaveBeenCalled();
    expect(await errorCode(() => schools.getSchool(student, 'school-a'))).toBe(
      'thrown: Error: Firestore was reached.',
    );
  });
});

describe('own records', () => {
  it('a profile is edited by its owner', async () => {
    const edit = (actor: Actor) => users.updateProfile(actor, 'student-9', { displayName: 'Hi' });
    for (const actor of [schoolAdmin, teacher, student]) {
      expect(await errorCode(() => edit(actor))).toBe('forbidden');
    }
    expect(getAdminDb).not.toHaveBeenCalled();
  });

  it('a profile patch is validated before anything is read', async () => {
    const fieldErrors = async (patch: Parameters<typeof users.updateProfile>[2]) => {
      try {
        await users.updateProfile(student, student.uid, patch);
      } catch (error) {
        return (error as { fieldErrors?: unknown }).fieldErrors;
      }
    };
    expect(await fieldErrors({ avatarId: 'unicorn' })).toEqual({ avatarId: ['invalid_choice'] });
    expect(await fieldErrors({ displayName: 'M' })).toEqual({
      displayName: ['display_name_length'],
    });
    expect(getAdminDb).not.toHaveBeenCalled();
  });

  it("a user's subscriptions are theirs", async () => {
    const list = (actor: Actor) => billing.listSubscriptionsForOwner(actor, 'user', 'student-9');
    for (const actor of [schoolAdmin, teacher, student]) {
      expect(await errorCode(() => list(actor))).toBe('forbidden');
    }
    expect(getAdminDb).not.toHaveBeenCalled();
  });

  it("a student learns nothing about another user's badges, XP or certificates", async () => {
    const other = 'student-9';
    expect(await errorCode(() => badges.listUserBadges(student, other))).toBe('not_found');
    expect(await errorCode(() => xp.listXpEntries(student, other, 20))).toBe('not_found');
    expect(await errorCode(() => certificates.listCertificatesForUser(student, other))).toBe(
      'not_found',
    );
    expect(getAdminDb).not.toHaveBeenCalled();
    // A teacher may teach one of the user's classes: that takes the profile.
    expect(await errorCode(() => badges.listUserBadges(teacher, other))).toBe(
      'thrown: Error: Firestore was reached.',
    );
  });

  it('a student lists no classes of a teacher, and the system has no upload quota', async () => {
    expect(await errorCode(() => classes.listClassesForTeacher(student, 'teacher-1'))).toBe(
      'forbidden',
    );
    expect(await errorCode(() => files.checkAndCountUpload(SYSTEM_ACTOR, 10))).toBe('forbidden');
    expect(getAdminDb).not.toHaveBeenCalled();
  });
});

describe('malformed ids', () => {
  // 'a/b/c' under a collection is the path of another document.
  const PATH = 'student-1/badges/ai-explorer';

  it('are answered as "does not exist" without a read', async () => {
    expect(await users.loadProfileForSession(PATH)).toBeNull();
    expect(await users.loadProfileForSession('')).toBeNull();
    expect(await pathways.getPublishedPathway('ai_explorer/x')).toBeNull();
    expect(await certificates.getCertificateByCode('RH-abc')).toBeNull();
    expect(await classes.findClassByJoinCode(SYSTEM_ACTOR, 'ABCDEFG1')).toBeNull();

    const notFound: (() => Promise<unknown>)[] = [
      () => users.getUser(platformAdmin, PATH),
      () => users.touchLastLogin(SYSTEM_ACTOR, PATH),
      () => schools.getSchool(platformAdmin, PATH),
      () => classes.getClass(platformAdmin, PATH),
      () => classes.listMembers(platformAdmin, PATH),
      () => classes.setAssignment(platformAdmin, 'class-a', PATH, null),
      () => files.getFile(platformAdmin, 'not-a-uuid'),
      () => files.getOwnFiles(student, [FILE_ID, PATH]),
      () => badges.getBadge(student, PATH),
      () => badges.listUserBadges(platformAdmin, PATH),
      () => certificates.getCertificate(platformAdmin, 'a/b'),
      () => certificates.listCertificatesForUser(platformAdmin, PATH),
      () => challenges.getChallenge(platformAdmin, PATH),
      () => challenges.setChallengeStatus(platformAdmin, PATH, 'published'),
      () => billing.upsertLicense(platformAdmin, PATH, licenseInput),
      () => xp.listXpEntries(platformAdmin, PATH, 20),
    ];
    for (const [index, call] of notFound.entries()) {
      expect(await errorCode(call), `call ${index}`).toBe('not_found');
    }
    expect(getAdminDb).not.toHaveBeenCalled();
  });
});

describe('AI usage and rate limits', () => {
  it('refuses a role that has no such AI feature, without a read', async () => {
    const refused = { allowed: false, reason: 'role', remainingToday: 0, retryAfterSeconds: null };
    const subject = (role: Role) => ({ uid: 'user-1', role, schoolId: 'school-a' });
    expect(await checkAndCountAiUsage(subject('school_admin'), 'tutor')).toEqual(refused);
    expect(await checkAndCountAiUsage(subject('platform_admin'), 'tutor')).toEqual(refused);
    expect(await checkAndCountAiUsage(subject('teacher'), 'lab')).toEqual(refused);
    expect(await checkAndCountAiUsage(subject('teacher'), 'review')).toEqual(refused);
    expect(await checkAndCountAiUsage(subject('student'), 'toString' as never)).toEqual(refused);
    expect(getAdminDb).not.toHaveBeenCalled();
  });

  it('takes only a known scope and a key that is safe in a document id', async () => {
    await expect(consumeRateLimit('constructor' as never, 'user-1')).rejects.toThrow(/scope/);
    await expect(consumeRateLimit('signup', '203.0.113.7')).rejects.toThrow(/key/);
    await expect(consumeRateLimit('signup', 'a/b')).rejects.toThrow(/key/);
    expect(getAdminDb).not.toHaveBeenCalled();
  });
});

describe('pure helpers', () => {
  const file: FileRecord = {
    id: FILE_ID,
    ownerUid: 'teacher-1',
    schoolId: 'school-a',
    purpose: 'course_media',
    kind: 'image',
    storagePath: `course-media/authors/teacher-1/${FILE_ID}/cover.png`,
    fileName: 'cover.png',
    contentType: 'image/png',
    sizeBytes: 2048,
    width: 800,
    height: 600,
    courseId: 'course-1',
    submissionId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  it('toFileRef and toMediaRef carry exactly their fields', () => {
    expect(files.toFileRef(file)).toEqual({
      fileId: FILE_ID,
      kind: 'image',
      fileName: 'cover.png',
      contentType: 'image/png',
      sizeBytes: 2048,
    });
    expect(files.toMediaRef(file)).toEqual({
      fileId: FILE_ID,
      storagePath: file.storagePath,
      fileName: 'cover.png',
      contentType: 'image/png',
      sizeBytes: 2048,
      width: 800,
      height: 600,
    });
  });

  it('clamps a school AI limit to 1–200 and a page size to 1–100', () => {
    expect(clampAiDailyMessageLimit(null)).toBeNull();
    expect(clampAiDailyMessageLimit(undefined)).toBeNull();
    expect(clampAiDailyMessageLimit(Number.NaN)).toBeNull();
    expect(clampAiDailyMessageLimit(0)).toBe(1);
    expect(clampAiDailyMessageLimit(-5)).toBe(1);
    expect(clampAiDailyMessageLimit(60.4)).toBe(60);
    expect(clampAiDailyMessageLimit(5000)).toBe(200);

    expect(clampLimit(undefined)).toBe(50);
    expect(clampLimit(Number.NaN)).toBe(50);
    expect(clampLimit(0)).toBe(1);
    expect(clampLimit(7.9)).toBe(7);
    expect(clampLimit(1000)).toBe(100);
  });

  it('names every audit action of the data model once', () => {
    expect(new Set(AUDIT_ACTIONS).size).toBe(AUDIT_ACTIONS.length);
    expect([...AUDIT_ACTIONS].sort()).toEqual([
      'badge.awarded',
      'certificate.issued',
      'certificate.revoked',
      'file.deleted',
      'license.upserted',
      'school.status_changed',
      'submission.reviewed',
      'subscription.upserted',
      'user.educator_verified',
      'user.password_reset',
      'user.role_changed',
      'user.status_changed',
    ]);
  });
});
