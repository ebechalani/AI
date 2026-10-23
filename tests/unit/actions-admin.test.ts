import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createSchoolAction,
  setChallengeStatusAction,
  setSchoolStatusAction,
  setUserRoleAction,
  setUserStatusAction,
  setVerifiedEducatorAction,
  updateSchoolAction,
  upsertChallengeAction,
  upsertLicenseAction,
  upsertSubscriptionAction,
} from '@/actions/admin';
import { assertSessionNotRevoked, getSession } from '@/lib/actions/session-source';
import { writeAudit } from '@/lib/data/audit';
import { listSubscriptionsForOwner, upsertLicense, upsertSubscription } from '@/lib/data/billing';
import { setChallengeStatus, upsertChallenge } from '@/lib/data/challenges';
import { getCourses } from '@/lib/data/courses';
import { listHardwarePlatforms } from '@/lib/data/hardware';
import { listPathways } from '@/lib/data/pathways';
import { getSchool, setSchoolStatus, updateSchool } from '@/lib/data/schools';
import { getUser } from '@/lib/data/users';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import {
  changeUserRole,
  createSchoolWithAdmin,
  setUserStatus,
  setVerifiedEducator,
} from '@/lib/services/provisioning';
import type { ActionResult, Role } from '@/types';
import type { License, Subscription } from '@/types/billing';
import type { ChallengeInput, LicenseInput, SubscriptionInput } from '@/types/inputs';
import { challenge, course, profile, school, session as sessionOf } from './services-fixtures';

// The platform admin's actions of WS-H (ARCHITECTURE.md 10.4): the one role they let through,
// what they hand to the repositories and services, the checks they add (owners, courses,
// pathways, kits and linked subscriptions must exist), the audit entries they write, and that
// the services' codes reach the client.

vi.mock('next-intl/server', () => ({ getLocale: vi.fn(() => Promise.resolve('en')) }));
vi.mock('@/lib/actions/session-source', () => ({
  getSession: vi.fn(),
  assertSessionNotRevoked: vi.fn(),
}));
vi.mock('@/lib/services/provisioning', () => ({
  changeUserRole: vi.fn(),
  createSchoolWithAdmin: vi.fn(),
  setUserStatus: vi.fn(),
  setVerifiedEducator: vi.fn(),
}));
vi.mock('@/lib/data/schools', () => ({
  getSchool: vi.fn(),
  setSchoolStatus: vi.fn(),
  updateSchool: vi.fn(),
}));
vi.mock('@/lib/data/users', () => ({ getUser: vi.fn() }));
vi.mock('@/lib/data/billing', () => ({
  listSubscriptionsForOwner: vi.fn(),
  upsertLicense: vi.fn(),
  upsertSubscription: vi.fn(),
}));
vi.mock('@/lib/data/challenges', () => ({
  setChallengeStatus: vi.fn(),
  upsertChallenge: vi.fn(),
}));
vi.mock('@/lib/data/courses', () => ({ getCourses: vi.fn() }));
vi.mock('@/lib/data/pathways', () => ({ listPathways: vi.fn() }));
vi.mock('@/lib/data/hardware', () => ({ listHardwarePlatforms: vi.fn() }));
vi.mock('@/lib/data/audit', () => ({ writeAudit: vi.fn() }));

const admin = sessionOf('platform_admin', 'admin-1');

const serviceMocks = [
  changeUserRole,
  createSchoolWithAdmin,
  setUserStatus,
  setVerifiedEducator,
  getSchool,
  setSchoolStatus,
  updateSchool,
  getUser,
  listSubscriptionsForOwner,
  upsertLicense,
  upsertSubscription,
  setChallengeStatus,
  upsertChallenge,
  getCourses,
  listPathways,
  listHardwarePlatforms,
  writeAudit,
];

const START = '2026-10-01T00:00:00.000Z';
const END = '2027-10-01T00:00:00.000Z';

function subscriptionOf(fields: Partial<Subscription> & { id: string }): Subscription {
  return {
    ownerType: 'school',
    ownerId: 'school-a',
    plan: 'school_annual',
    status: 'active',
    currentPeriodStart: START,
    currentPeriodEnd: END,
    courseIds: [],
    provider: 'manual',
    providerCustomerId: null,
    providerSubscriptionId: null,
    notes: null,
    createdByUid: 'admin-1',
    createdAt: START,
    updatedAt: START,
    ...fields,
  };
}

function licenseOf(fields: Partial<License> & { id: string }): License {
  return {
    schoolId: 'school-a',
    subscriptionId: null,
    name: 'Licence',
    seatsTotal: 20,
    scope: { type: 'all_official' },
    startsAt: START,
    endsAt: END,
    status: 'active',
    createdByUid: 'admin-1',
    createdAt: START,
    updatedAt: START,
    ...fields,
  };
}

const subscriptionInput = (fields: Partial<SubscriptionInput> = {}): SubscriptionInput => ({
  ownerType: 'school',
  ownerId: 'school-a',
  plan: 'school_annual',
  status: 'active',
  currentPeriodStart: START,
  currentPeriodEnd: END,
  courseIds: [],
  notes: null,
  ...fields,
});

const licenseInput = (fields: Partial<LicenseInput> = {}): LicenseInput => ({
  schoolId: 'school-a',
  subscriptionId: null,
  name: 'School year',
  seatsTotal: 20,
  scope: { type: 'all_official' },
  startsAt: START,
  endsAt: END,
  status: 'active',
  ...fields,
});

const challengeInput = (fields: Partial<ChallengeInput> = {}): ChallengeInput => ({
  type: 'weekly',
  scope: 'global',
  schoolId: null,
  area: 'ai',
  ageMin: null,
  ageMax: null,
  startAt: START,
  deadlineAt: END,
  allowedSubmissionTypes: ['text'],
  rubric: [
    { key: 'creativity', weight: 50 },
    { key: 'understanding', weight: 50 },
  ],
  xpReward: 500,
  coverImageFileId: null,
  hardwarePlatformIds: [],
  requiredCapabilities: [],
  defaultLocale: 'en',
  translations: {
    en: { title: 'Poster', description: 'Make one', submissionRequirements: 'An image', prizes: null },
  },
  ...fields,
});

function signIn(role: Role | null): void {
  vi.mocked(getSession).mockResolvedValue(role === null ? null : sessionOf(role, `${role}-1`));
}

function failure(result: ActionResult<unknown>) {
  if (result.ok) throw new Error('Expected a failure.');
  return result.error;
}

function data<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(`Expected a success, got ${result.error.code}.`);
  return result.data;
}

beforeEach(() => {
  for (const mock of serviceMocks) vi.mocked(mock).mockReset();
  vi.mocked(getSession).mockReset().mockResolvedValue(admin);
  vi.mocked(assertSessionNotRevoked).mockReset().mockResolvedValue(undefined);
  vi.mocked(createSchoolWithAdmin).mockResolvedValue({
    school: school({ id: 'school-new', name: 'New School' }),
    admin: profile({ id: 'admin-new', role: 'school_admin', email: 'new@school.test' }),
  });
  vi.mocked(updateSchool).mockResolvedValue(school({ id: 'school-a' }));
  vi.mocked(getSchool).mockResolvedValue(school({ id: 'school-a', status: 'active' }));
  vi.mocked(setSchoolStatus).mockResolvedValue(undefined);
  vi.mocked(changeUserRole).mockResolvedValue(undefined);
  vi.mocked(setUserStatus).mockResolvedValue(undefined);
  vi.mocked(setVerifiedEducator).mockResolvedValue(undefined);
  vi.mocked(getUser).mockResolvedValue(profile({ id: 'u1', role: 'student' }));
  vi.mocked(getCourses).mockResolvedValue([]);
  vi.mocked(upsertSubscription).mockResolvedValue(subscriptionOf({ id: 'sub-1' }));
  vi.mocked(listSubscriptionsForOwner).mockResolvedValue([subscriptionOf({ id: 'sub-1' })]);
  vi.mocked(listPathways).mockResolvedValue([]);
  vi.mocked(upsertLicense).mockResolvedValue(licenseOf({ id: 'lic-1' }));
  vi.mocked(listHardwarePlatforms).mockResolvedValue([]);
  vi.mocked(upsertChallenge).mockResolvedValue(challenge({ id: 'ch-1' }));
  vi.mocked(setChallengeStatus).mockResolvedValue(undefined);
  vi.mocked(writeAudit).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const ACTIONS = [
  ['createSchoolAction', () => createSchoolAction({ school: { name: 'New School', country: 'LB', city: null, defaultLocale: 'en' }, adminDisplayName: 'Admin One', adminEmail: 'new@school.test' }), createSchoolWithAdmin],
  ['updateSchoolAction', () => updateSchoolAction({ schoolId: 'school-a', patch: { name: 'Renamed' } }), updateSchool],
  ['setSchoolStatusAction', () => setSchoolStatusAction({ schoolId: 'school-a', status: 'suspended' }), setSchoolStatus],
  ['setUserRoleAction', () => setUserRoleAction({ uid: 'u1', role: 'teacher', schoolId: 'school-a' }), changeUserRole],
  ['setUserStatusAction', () => setUserStatusAction({ uid: 'u1', status: 'disabled' }), setUserStatus],
  ['setVerifiedEducatorAction', () => setVerifiedEducatorAction({ uid: 'u1', verified: true }), setVerifiedEducator],
  ['upsertSubscriptionAction', () => upsertSubscriptionAction({ subscriptionId: null, input: subscriptionInput() }), upsertSubscription],
  ['upsertLicenseAction', () => upsertLicenseAction({ licenseId: null, input: licenseInput() }), upsertLicense],
  ['upsertChallengeAction', () => upsertChallengeAction({ challengeId: null, input: challengeInput() }), upsertChallenge],
  ['setChallengeStatusAction', () => setChallengeStatusAction({ challengeId: 'ch-1', status: 'published' }), setChallengeStatus],
] as const satisfies readonly (readonly [string, () => Promise<ActionResult<unknown>>, unknown])[];

const ROLES: Role[] = ['student', 'teacher', 'school_admin', 'platform_admin'];

describe.each(ACTIONS)('%s roles (ARCHITECTURE.md 10.4: platform admin only)', (_name, call, service) => {
  it.each(ROLES)('%s', async (role) => {
    signIn(role);
    const result = await call();
    if (role === 'platform_admin') {
      expect(result.ok).toBe(true);
      expect(service).toHaveBeenCalledTimes(1);
    } else {
      expect(result).toEqual({ ok: false, error: { code: 'forbidden' } });
      expect(service).not.toHaveBeenCalled();
    }
  });

  it('answers unauthenticated without a session', async () => {
    signIn(null);
    expect(await call()).toEqual({ ok: false, error: { code: 'unauthenticated' } });
    expect(service).not.toHaveBeenCalled();
  });
});

describe('createSchoolAction', () => {
  it('normalises the payload before the service and answers the ids', async () => {
    const result = await createSchoolAction({
      school: { name: '  New School ', country: 'lb', city: ' Beirut ', defaultLocale: 'fr' },
      adminDisplayName: 'Admin One',
      adminEmail: ' New@School.Test ',
    });
    expect(data(result)).toEqual({ schoolId: 'school-new', adminEmail: 'new@school.test' });
    expect(createSchoolWithAdmin).toHaveBeenCalledWith(admin, {
      school: { name: 'New School', country: 'LB', city: 'Beirut', defaultLocale: 'fr' },
      adminDisplayName: 'Admin One',
      adminEmail: 'new@school.test',
    });
  });

  it('refuses a country that is not two letters, without a call', async () => {
    const error = failure(
      await createSchoolAction({
        school: { name: 'New School', country: 'Lebanon', city: null, defaultLocale: 'en' },
        adminDisplayName: 'Admin One',
        adminEmail: 'new@school.test',
      }),
    );
    expect(error.code).toBe('validation');
    expect(error.fieldErrors?.['school.country']).toEqual(['invalid']);
    expect(createSchoolWithAdmin).not.toHaveBeenCalled();
  });

  it('passes a conflict and a validation of the service through', async () => {
    const input = {
      school: { name: 'New School', country: 'LB', city: null, defaultLocale: 'en' as const },
      adminDisplayName: 'Admin One',
      adminEmail: 'new@school.test',
    };
    vi.mocked(createSchoolWithAdmin).mockRejectedValueOnce(new ConflictError('exists'));
    expect(failure(await createSchoolAction(input)).code).toBe('conflict');
    vi.mocked(createSchoolWithAdmin).mockRejectedValueOnce(
      new ValidationError('bad', { adminEmail: ['invalid_email'] }),
    );
    expect(failure(await createSchoolAction(input))).toEqual({
      code: 'validation',
      fieldErrors: { adminEmail: ['invalid_email'] },
    });
  });
});

describe('updateSchoolAction', () => {
  it('hands the patch unchanged', async () => {
    const result = await updateSchoolAction({
      schoolId: 'school-a',
      patch: { city: 'Tripoli', settings: { aiEnabled: false, aiDailyMessageLimit: 30, joinCodesEnabled: true } },
    });
    expect(result).toEqual({ ok: true, data: null });
    expect(updateSchool).toHaveBeenCalledWith(admin, 'school-a', {
      city: 'Tripoli',
      settings: { aiEnabled: false, aiDailyMessageLimit: 30, joinCodesEnabled: true },
    });
  });

  it('refuses a limit below 1 without a call', async () => {
    const error = failure(
      await updateSchoolAction({
        schoolId: 'school-a',
        patch: { settings: { aiEnabled: true, aiDailyMessageLimit: 0, joinCodesEnabled: true } },
      }),
    );
    expect(error.fieldErrors?.['patch.settings.aiDailyMessageLimit']).toEqual(['too_small']);
    expect(updateSchool).not.toHaveBeenCalled();
  });

  it('answers not_found for a missing school', async () => {
    vi.mocked(updateSchool).mockRejectedValueOnce(new NotFoundError());
    expect(failure(await updateSchoolAction({ schoolId: 'school-x', patch: { name: 'Gone School' } })).code).toBe(
      'not_found',
    );
  });
});

describe('setSchoolStatusAction', () => {
  it('does nothing for the same status', async () => {
    expect(await setSchoolStatusAction({ schoolId: 'school-a', status: 'active' })).toEqual({
      ok: true,
      data: null,
    });
    expect(setSchoolStatus).not.toHaveBeenCalled();
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it('changes the status and writes the audit entry', async () => {
    await setSchoolStatusAction({ schoolId: 'school-a', status: 'suspended' });
    expect(setSchoolStatus).toHaveBeenCalledWith(admin, 'school-a', 'suspended');
    expect(writeAudit).toHaveBeenCalledWith(admin, {
      action: 'school.status_changed',
      targetType: 'school',
      targetId: 'school-a',
      schoolId: 'school-a',
      meta: { status: 'suspended', previousStatus: 'active' },
    });
  });

  it('still succeeds when the audit entry cannot be written', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(writeAudit).mockRejectedValueOnce(new Error('offline'));
    expect(await setSchoolStatusAction({ schoolId: 'school-a', status: 'suspended' })).toEqual({
      ok: true,
      data: null,
    });
    expect(consoleError).toHaveBeenCalled();
  });

  it('answers not_found for a missing school', async () => {
    vi.mocked(getSchool).mockRejectedValueOnce(new NotFoundError());
    expect(failure(await setSchoolStatusAction({ schoolId: 'school-x', status: 'suspended' })).code).toBe(
      'not_found',
    );
    expect(setSchoolStatus).not.toHaveBeenCalled();
  });
});

describe('setUserRoleAction', () => {
  it('hands the role and the school to the service', async () => {
    await setUserRoleAction({ uid: 'u1', role: 'teacher', schoolId: 'school-a' });
    expect(changeUserRole).toHaveBeenCalledWith(admin, 'u1', 'teacher', 'school-a');
  });

  it('refuses a school admin without a school and a platform admin with one', async () => {
    const noSchool = failure(await setUserRoleAction({ uid: 'u1', role: 'school_admin', schoolId: null }));
    expect(noSchool.fieldErrors?.schoolId).toEqual(['required']);
    const withSchool = failure(
      await setUserRoleAction({ uid: 'u1', role: 'platform_admin', schoolId: 'school-a' }),
    );
    expect(withSchool.fieldErrors?.schoolId).toEqual(['invalid']);
    expect(changeUserRole).not.toHaveBeenCalled();
  });

  it.each([
    ['forbidden', new ForbiddenError()],
    ['conflict', new ConflictError()],
    ['not_found', new NotFoundError()],
  ])('passes %s through', async (code, error) => {
    vi.mocked(changeUserRole).mockRejectedValueOnce(error);
    expect(failure(await setUserRoleAction({ uid: 'u1', role: 'student', schoolId: null })).code).toBe(code);
  });
});

describe('setUserStatusAction and setVerifiedEducatorAction', () => {
  it('hand the uid and the value to the service', async () => {
    await setUserStatusAction({ uid: 'u1', status: 'disabled' });
    expect(setUserStatus).toHaveBeenCalledWith(admin, 'u1', 'disabled');
    await setVerifiedEducatorAction({ uid: 'u1', verified: true });
    expect(setVerifiedEducator).toHaveBeenCalledWith(admin, 'u1', true);
  });

  it('pass the services’ codes through', async () => {
    vi.mocked(setUserStatus).mockRejectedValueOnce(new ForbiddenError());
    expect(failure(await setUserStatusAction({ uid: 'admin-1', status: 'disabled' })).code).toBe('forbidden');
    vi.mocked(setVerifiedEducator).mockRejectedValueOnce(new ConflictError());
    expect(failure(await setVerifiedEducatorAction({ uid: 'u1', verified: true })).code).toBe('conflict');
  });
});

describe('upsertSubscriptionAction', () => {
  it('checks a school owner, stores and audits', async () => {
    const result = await upsertSubscriptionAction({ subscriptionId: null, input: subscriptionInput() });
    expect(data(result)).toEqual({ subscriptionId: 'sub-1' });
    expect(getSchool).toHaveBeenCalledWith(admin, 'school-a');
    expect(getUser).not.toHaveBeenCalled();
    expect(upsertSubscription).toHaveBeenCalledWith(admin, null, subscriptionInput());
    expect(writeAudit).toHaveBeenCalledWith(admin, {
      action: 'subscription.upserted',
      targetType: 'subscription',
      targetId: 'sub-1',
      schoolId: 'school-a',
      meta: { ownerType: 'school', ownerId: 'school-a', plan: 'school_annual', status: 'active', created: true },
    });
  });

  it('checks a user owner and audits without a school', async () => {
    const input = subscriptionInput({ ownerType: 'user', ownerId: 'u1', plan: 'individual_yearly' });
    vi.mocked(upsertSubscription).mockResolvedValueOnce(subscriptionOf({ id: 'sub-2', ...input }));
    await upsertSubscriptionAction({ subscriptionId: 'sub-2', input });
    expect(getUser).toHaveBeenCalledWith(admin, 'u1');
    expect(writeAudit).toHaveBeenCalledWith(
      admin,
      expect.objectContaining({ schoolId: null, meta: expect.objectContaining({ created: false }) }),
    );
  });

  it('refuses a missing owner as a field error, without storing', async () => {
    vi.mocked(getSchool).mockRejectedValueOnce(new NotFoundError());
    const error = failure(await upsertSubscriptionAction({ subscriptionId: null, input: subscriptionInput() }));
    expect(error).toEqual({ code: 'validation', fieldErrors: { 'input.ownerId': ['invalid_choice'] } });
    expect(upsertSubscription).not.toHaveBeenCalled();
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it.each(['school_admin', 'platform_admin'] as const)(
    'refuses a new subscription for a %s owner but accepts an edit',
    async (role) => {
      vi.mocked(getUser).mockResolvedValue(profile({ id: 'u1', role }));
      const input = subscriptionInput({ ownerType: 'user', ownerId: 'u1', plan: 'individual_monthly' });
      const created = failure(await upsertSubscriptionAction({ subscriptionId: null, input }));
      expect(created.fieldErrors).toEqual({ 'input.ownerId': ['invalid_choice'] });
      expect(upsertSubscription).not.toHaveBeenCalled();
      expect((await upsertSubscriptionAction({ subscriptionId: 'sub-1', input })).ok).toBe(true);
      expect(upsertSubscription).toHaveBeenCalledTimes(1);
    },
  );

  it('refuses a course that is missing or not official', async () => {
    const input = subscriptionInput({
      ownerType: 'user',
      ownerId: 'u1',
      plan: 'course_purchase',
      courseIds: ['course-1', 'course-2'],
    });
    vi.mocked(getCourses).mockResolvedValueOnce([course({ id: 'course-1', isOfficial: true })]);
    expect(failure(await upsertSubscriptionAction({ subscriptionId: null, input })).fieldErrors).toEqual({
      'input.courseIds': ['invalid_choice'],
    });
    vi.mocked(getCourses).mockResolvedValueOnce([
      course({ id: 'course-1', isOfficial: true }),
      course({ id: 'course-2', isOfficial: false }),
    ]);
    expect(failure(await upsertSubscriptionAction({ subscriptionId: null, input })).fieldErrors).toEqual({
      'input.courseIds': ['invalid_choice'],
    });
    expect(upsertSubscription).not.toHaveBeenCalled();
  });

  it('refuses an individual plan for a school owner before any read', async () => {
    const error = failure(
      await upsertSubscriptionAction({
        subscriptionId: null,
        input: subscriptionInput({ plan: 'individual_yearly' }),
      }),
    );
    expect(error.fieldErrors?.['input.plan']).toEqual(['invalid_choice']);
    expect(getSchool).not.toHaveBeenCalled();
  });
});

describe('upsertLicenseAction', () => {
  it('refuses a subscription that is not the school’s', async () => {
    const error = failure(
      await upsertLicenseAction({ licenseId: null, input: licenseInput({ subscriptionId: 'sub-9' }) }),
    );
    expect(error).toEqual({ code: 'validation', fieldErrors: { 'input.subscriptionId': ['invalid_choice'] } });
    expect(listSubscriptionsForOwner).toHaveBeenCalledWith(admin, 'school', 'school-a');
    expect(upsertLicense).not.toHaveBeenCalled();
  });

  it('accepts one of the school’s subscriptions and reads none when unlinked', async () => {
    expect((await upsertLicenseAction({ licenseId: null, input: licenseInput({ subscriptionId: 'sub-1' }) })).ok).toBe(true);
    await upsertLicenseAction({ licenseId: null, input: licenseInput() });
    expect(listSubscriptionsForOwner).toHaveBeenCalledTimes(1);
  });

  it('refuses a pathway it cannot find and reads none for all_official', async () => {
    vi.mocked(listPathways).mockResolvedValueOnce([
      { id: 'ai-explorer' } as Awaited<ReturnType<typeof listPathways>>[number],
    ]);
    const error = failure(
      await upsertLicenseAction({
        licenseId: null,
        input: licenseInput({ scope: { type: 'pathways', pathwayIds: ['ai-explorer', 'gone'] } }),
      }),
    );
    expect(error.fieldErrors).toEqual({ 'input.scope.pathwayIds': ['invalid_choice'] });
    expect(upsertLicense).not.toHaveBeenCalled();
    await upsertLicenseAction({ licenseId: null, input: licenseInput() });
    expect(listPathways).toHaveBeenCalledTimes(1);
  });

  it('answers not_found when the school is missing, else audits and answers the id', async () => {
    vi.mocked(upsertLicense).mockRejectedValueOnce(new NotFoundError());
    expect(failure(await upsertLicenseAction({ licenseId: null, input: licenseInput() })).code).toBe('not_found');
    const result = await upsertLicenseAction({ licenseId: 'lic-1', input: licenseInput({ status: 'suspended' }) });
    expect(data(result)).toEqual({ licenseId: 'lic-1' });
    expect(writeAudit).toHaveBeenCalledWith(admin, {
      action: 'license.upserted',
      targetType: 'license',
      targetId: 'lic-1',
      schoolId: 'school-a',
      meta: { seatsTotal: 20, status: 'suspended', scope: 'all_official', subscriptionId: null, created: false },
    });
  });
});

describe('upsertChallengeAction', () => {
  it('checks the school of a school-scoped challenge', async () => {
    const input = challengeInput({ scope: 'school', schoolId: 'school-a' });
    expect(data(await upsertChallengeAction({ challengeId: null, input }))).toEqual({ challengeId: 'ch-1' });
    expect(getSchool).toHaveBeenCalledWith(admin, 'school-a');
    vi.mocked(getSchool).mockRejectedValueOnce(new NotFoundError());
    expect(failure(await upsertChallengeAction({ challengeId: null, input })).fieldErrors).toEqual({
      'input.schoolId': ['invalid_choice'],
    });
  });

  it('reads no school for a global challenge', async () => {
    await upsertChallengeAction({ challengeId: null, input: challengeInput() });
    expect(getSchool).not.toHaveBeenCalled();
    expect(listHardwarePlatforms).not.toHaveBeenCalled();
  });

  it('checks the kits, inactive ones included', async () => {
    const platform = (id: string, isActive: boolean) =>
      ({ id, isActive }) as Awaited<ReturnType<typeof listHardwarePlatforms>>[number];
    vi.mocked(listHardwarePlatforms).mockResolvedValue([platform('kit-a', true), platform('kit-old', false)]);
    const ok = await upsertChallengeAction({
      challengeId: 'ch-1',
      input: challengeInput({ hardwarePlatformIds: ['kit-a', 'kit-old'] }),
    });
    expect(ok.ok).toBe(true);
    const bad = failure(
      await upsertChallengeAction({ challengeId: 'ch-1', input: challengeInput({ hardwarePlatformIds: ['kit-x'] }) }),
    );
    expect(bad.fieldErrors).toEqual({ 'input.hardwarePlatformIds': ['invalid_choice'] });
  });

  it('passes the repository’s cover error unchanged and refuses a deadline before the start', async () => {
    vi.mocked(upsertChallenge).mockRejectedValueOnce(new ValidationError('bad', { coverImageFileId: ['invalid'] }));
    expect(failure(await upsertChallengeAction({ challengeId: null, input: challengeInput() }))).toEqual({
      code: 'validation',
      fieldErrors: { coverImageFileId: ['invalid'] },
    });
    const order = failure(
      await upsertChallengeAction({ challengeId: null, input: challengeInput({ startAt: END, deadlineAt: START }) }),
    );
    expect(order.fieldErrors?.['input.deadlineAt']).toEqual(['date_order']);
    expect(upsertChallenge).toHaveBeenCalledTimes(1);
  });
});

describe('setChallengeStatusAction', () => {
  it('hands the status to the repository and refuses a phase as a status', async () => {
    await setChallengeStatusAction({ challengeId: 'ch-1', status: 'published' });
    expect(setChallengeStatus).toHaveBeenCalledWith(admin, 'ch-1', 'published');
    const error = failure(
      await setChallengeStatusAction({ challengeId: 'ch-1', status: 'open' as never }),
    );
    expect(error.code).toBe('validation');
  });
});
