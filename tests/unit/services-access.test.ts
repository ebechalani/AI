import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SYSTEM_ACTOR } from '@/lib/auth/actor';
import { listLicensesForSchool, listSubscriptionsForOwner } from '@/lib/data/billing';
import { getClass } from '@/lib/data/classes';
import { getEnrollment } from '@/lib/data/enrollments';
import { NotFoundError } from '@/lib/errors';
import { getCourseAccess, licenseCovers, subscriptionCovers } from '@/lib/services/access';
import type {
  Course,
  Enrollment,
  License,
  Role,
  SchoolClass,
  Session,
  Subscription,
} from '@/types';

// services/access (ARCHITECTURE.md 4.5) over mocked repositories: the decision table of
// getCourseAccess and the two pure cover predicates.

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(() => {
    throw new Error('Firestore was reached.');
  }),
}));
vi.mock('@/lib/data/billing', () => ({
  listLicensesForSchool: vi.fn(),
  listSubscriptionsForOwner: vi.fn(),
}));
vi.mock('@/lib/data/classes', () => ({ getClass: vi.fn() }));
vi.mock('@/lib/data/enrollments', () => ({ getEnrollment: vi.fn() }));

const NOW = new Date('2026-10-02T08:00:00.000Z');
const PAST = '2026-01-01T00:00:00.000Z';
const FUTURE = '2027-01-01T00:00:00.000Z';

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

function course(fields: Partial<Course> = {}): Course {
  return {
    id: 'course-1',
    pathwayId: 'ai-explorer',
    order: 1,
    ownerUid: 'author-1',
    schoolId: null,
    isOfficial: true,
    status: 'published',
    visibility: 'public',
    audience: 'student',
    area: 'ai',
    tags: [],
    ageMin: null,
    ageMax: null,
    estimatedMinutes: 60,
    accessTier: 'free',
    certificateEnabled: true,
    coverImage: null,
    hardwarePlatformIds: [],
    requiredCapabilities: [],
    moduleCount: 1,
    lessonCount: 3,
    defaultLocale: 'en',
    translations: { en: { title: 'Course', summary: '', description: '', outcomes: [] } },
    publishedAt: PAST,
    createdAt: PAST,
    updatedAt: PAST,
    ...fields,
  };
}

function license(fields: Partial<License> = {}): License {
  return {
    id: 'license-1',
    schoolId: 'school-a',
    subscriptionId: null,
    name: 'Licence',
    seatsTotal: 100,
    scope: { type: 'all_official' },
    startsAt: PAST,
    endsAt: FUTURE,
    status: 'active',
    createdByUid: 'platform_admin-1',
    createdAt: PAST,
    updatedAt: PAST,
    ...fields,
  };
}

function subscription(fields: Partial<Subscription> = {}): Subscription {
  return {
    id: 'subscription-1',
    ownerType: 'user',
    ownerId: 'student-1',
    plan: 'individual_monthly',
    status: 'active',
    currentPeriodStart: PAST,
    currentPeriodEnd: FUTURE,
    courseIds: [],
    provider: 'manual',
    providerCustomerId: null,
    providerSubscriptionId: null,
    notes: null,
    createdByUid: 'platform_admin-1',
    createdAt: PAST,
    updatedAt: PAST,
    ...fields,
  };
}

function schoolClass(fields: Partial<SchoolClass> = {}): SchoolClass {
  return {
    id: 'class-a',
    schoolId: 'school-a',
    name: 'Grade 6 A',
    gradeLabel: null,
    ageBand: '11-12',
    ownerUid: 'teacher-1',
    teacherUids: ['teacher-1'],
    joinCode: 'ABCDEFGH',
    joinCodeEnabled: false,
    joinCodeExpiresAt: null,
    studentCount: 1,
    assignedCourseIds: [],
    archived: false,
    createdAt: PAST,
    updatedAt: PAST,
    ...fields,
  };
}

const premium = () => course({ accessTier: 'premium' });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listLicensesForSchool).mockResolvedValue([]);
  vi.mocked(listSubscriptionsForOwner).mockResolvedValue([]);
  vi.mocked(getEnrollment).mockResolvedValue(null);
  vi.mocked(getClass).mockRejectedValue(new NotFoundError('no class'));
});

describe('licenseCovers', () => {
  it('needs an active licence inside its dates with a scope that names the course', () => {
    expect(licenseCovers(license(), premium(), NOW)).toBe(true);
    expect(licenseCovers(license({ status: 'suspended' }), premium(), NOW)).toBe(false);
    expect(licenseCovers(license({ startsAt: FUTURE, endsAt: FUTURE }), premium(), NOW)).toBe(
      false,
    );
    expect(licenseCovers(license({ endsAt: PAST }), premium(), NOW)).toBe(false);
    expect(licenseCovers(license(), premium(), new Date(FUTURE))).toBe(false);
    const pathways = license({ scope: { type: 'pathways', pathwayIds: ['ai-explorer'] } });
    expect(licenseCovers(pathways, premium(), NOW)).toBe(true);
    expect(
      licenseCovers(pathways, course({ accessTier: 'premium', pathwayId: 'other' }), NOW),
    ).toBe(false);
    expect(licenseCovers(license(), course({ isOfficial: false }), NOW)).toBe(false);
  });
});

describe('subscriptionCovers', () => {
  it('individual plans cover every student course while trialing or active and inside the period', () => {
    expect(subscriptionCovers(subscription(), premium(), NOW)).toBe(true);
    expect(subscriptionCovers(subscription({ status: 'trialing' }), premium(), NOW)).toBe(true);
    expect(subscriptionCovers(subscription({ status: 'canceled' }), premium(), NOW)).toBe(false);
    expect(subscriptionCovers(subscription({ status: 'past_due' }), premium(), NOW)).toBe(false);
    expect(subscriptionCovers(subscription({ currentPeriodEnd: PAST }), premium(), NOW)).toBe(
      false,
    );
    expect(
      subscriptionCovers(
        subscription(),
        course({ accessTier: 'premium', audience: 'teacher' }),
        NOW,
      ),
    ).toBe(false);
  });

  it('course-scoped plans cover the courses they name', () => {
    const purchase = subscription({ plan: 'course_purchase', courseIds: ['course-1'] });
    expect(subscriptionCovers(purchase, premium(), NOW)).toBe(true);
    expect(
      subscriptionCovers(purchase, course({ id: 'course-2', accessTier: 'premium' }), NOW),
    ).toBe(false);
    const training = subscription({ plan: 'teacher_training', courseIds: ['course-1'] });
    expect(
      subscriptionCovers(training, course({ accessTier: 'premium', audience: 'teacher' }), NOW),
    ).toBe(true);
  });
});

describe('getCourseAccess', () => {
  it('answers not_visible when canViewCourse fails, with no billing read', async () => {
    const student = session('student');
    expect(await getCourseAccess(student, course({ status: 'draft' }))).toEqual({
      allowed: false,
      reason: 'not_visible',
    });
    expect(await getCourseAccess(student, course({ audience: 'teacher' }))).toEqual({
      allowed: false,
      reason: 'not_visible',
    });
    expect(listLicensesForSchool).not.toHaveBeenCalled();
    expect(listSubscriptionsForOwner).not.toHaveBeenCalled();
  });

  it('lets the owner, platform admins and the system in before any other question', async () => {
    const teacher = session('teacher');
    const own = course({ isOfficial: false, ownerUid: teacher.uid, accessTier: 'premium' });
    expect(await getCourseAccess(teacher, own)).toEqual({ allowed: true, via: 'owner' });
    expect(await getCourseAccess(session('platform_admin'), course({ status: 'draft' }))).toEqual({
      allowed: true,
      via: 'staff_preview',
    });
    expect(await getCourseAccess(SYSTEM_ACTOR, premium())).toEqual({
      allowed: true,
      via: 'staff_preview',
    });
    expect(listLicensesForSchool).not.toHaveBeenCalled();
  });

  it('free: learners get it, staff who cannot enrol get the preview', async () => {
    expect(await getCourseAccess(session('student'), course())).toEqual({
      allowed: true,
      via: 'free',
    });
    expect(await getCourseAccess(session('teacher', 'school-a'), course())).toEqual({
      allowed: true,
      via: 'staff_preview',
    });
    expect(
      await getCourseAccess(session('teacher', 'school-a'), course({ audience: 'teacher' })),
    ).toEqual({ allowed: true, via: 'free' });
    expect(await getCourseAccess(session('school_admin', 'school-a'), course())).toEqual({
      allowed: true,
      via: 'staff_preview',
    });
    expect(listLicensesForSchool).not.toHaveBeenCalled();
  });

  it('a teacher-made course exists for an outsider only through an enrollment', async () => {
    const other = session('student', 'school-b');
    const made = course({
      isOfficial: false,
      ownerUid: 'teacher-9',
      schoolId: 'school-a',
      visibility: 'private',
    });
    expect(await getCourseAccess(other, made)).toEqual({ allowed: false, reason: 'not_visible' });
    expect(getEnrollment).toHaveBeenCalledWith(other, other.uid, made.id);

    vi.mocked(getEnrollment).mockResolvedValue({ id: 'e' } as Enrollment);
    expect(await getCourseAccess(other, made)).toEqual({ allowed: true, via: 'free' });
  });

  it('premium: the school licence is read as the system and wins', async () => {
    const student = session('student', 'school-a', ['class-a']);
    vi.mocked(listLicensesForSchool).mockResolvedValue([license()]);
    expect(await getCourseAccess(student, premium())).toEqual({ allowed: true, via: 'license' });
    expect(listLicensesForSchool).toHaveBeenCalledWith(SYSTEM_ACTOR, 'school-a');
    expect(listSubscriptionsForOwner).not.toHaveBeenCalled();
  });

  it('premium: then the user’s own subscription', async () => {
    const student = session('student');
    vi.mocked(listSubscriptionsForOwner).mockResolvedValue([subscription()]);
    expect(await getCourseAccess(student, premium())).toEqual({
      allowed: true,
      via: 'subscription',
    });
    expect(listLicensesForSchool).not.toHaveBeenCalled();
    expect(listSubscriptionsForOwner).toHaveBeenCalledWith(student, 'user', student.uid);
  });

  it('premium: then a live class of the student that has the course assigned', async () => {
    const student = session('student', 'school-a', ['class-a', 'class-z']);
    vi.mocked(getClass).mockImplementation(async (_actor, classId) => {
      if (classId === 'class-a')
        return schoolClass({ assignedCourseIds: ['course-1'], archived: true });
      if (classId === 'class-z')
        return schoolClass({ id: 'class-z', assignedCourseIds: ['course-1'] });
      throw new NotFoundError('no class');
    });
    expect(await getCourseAccess(student, premium())).toEqual({
      allowed: true,
      via: 'class_assignment',
    });

    vi.mocked(getClass).mockResolvedValue(
      schoolClass({ assignedCourseIds: ['course-1'], archived: true }),
    );
    expect(await getCourseAccess(student, premium())).toEqual({
      allowed: false,
      reason: 'license_required',
    });
  });

  it('premium: a teacher without a covering licence or subscription gets nothing, even for a preview', async () => {
    const teacher = session('teacher', 'school-a', ['class-a']);
    vi.mocked(listLicensesForSchool).mockResolvedValue([license({ status: 'suspended' })]);
    expect(await getCourseAccess(teacher, premium())).toEqual({
      allowed: false,
      reason: 'license_required',
    });
    expect(getClass).not.toHaveBeenCalled();

    const independent = session('teacher');
    expect(await getCourseAccess(independent, premium())).toEqual({
      allowed: false,
      reason: 'license_required',
    });
    expect(listLicensesForSchool).toHaveBeenCalledTimes(1);
  });
});
