import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTeacherAction,
  setClassTeachersAction,
  setSchoolUserStatusAction,
  updateSchoolSettingsAction,
} from '@/actions/school';
import { assertSessionNotRevoked, getSession } from '@/lib/actions/session-source';
import { updateSchool } from '@/lib/data/schools';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { setClassTeachers } from '@/lib/services/classroom';
import { createTeacher, setUserStatus } from '@/lib/services/provisioning';
import type { ActionResult, Role } from '@/types';
import { profile, school, session as sessionOf } from './services-fixtures';

// The school admin's actions (ARCHITECTURE.md 10.4): only a school admin passes, the school is
// always the session's (never the payload's), the schemas trim and refuse before any call, and
// the services' codes reach the client unchanged.

vi.mock('next-intl/server', () => ({ getLocale: vi.fn(() => Promise.resolve('en')) }));
vi.mock('@/lib/actions/session-source', () => ({
  getSession: vi.fn(),
  assertSessionNotRevoked: vi.fn(),
}));
vi.mock('@/lib/services/provisioning', () => ({
  createTeacher: vi.fn(),
  setUserStatus: vi.fn(),
}));
vi.mock('@/lib/services/classroom', () => ({ setClassTeachers: vi.fn() }));
vi.mock('@/lib/data/schools', () => ({ updateSchool: vi.fn() }));

const admin = sessionOf('school_admin', 'admin-1', 'school-a');
const schoolless = sessionOf('school_admin', 'admin-2', null);
const rana = profile({ id: 't-1', role: 'teacher', email: 'rana@school.test' });

const serviceMocks = [createTeacher, setUserStatus, updateSchool, setClassTeachers];

function signIn(role: Role | null): void {
  if (role === null) vi.mocked(getSession).mockResolvedValue(null);
  else if (role === 'school_admin') vi.mocked(getSession).mockResolvedValue(admin);
  else vi.mocked(getSession).mockResolvedValue(sessionOf(role, `${role}-1`));
}

function failure(result: ActionResult<unknown>) {
  if (result.ok) throw new Error('Expected a failure.');
  return result.error;
}

const SETTINGS = { aiEnabled: false, aiDailyMessageLimit: 30, joinCodesEnabled: true };

beforeEach(() => {
  for (const mock of serviceMocks) vi.mocked(mock).mockReset();
  vi.mocked(getSession).mockReset().mockResolvedValue(admin);
  vi.mocked(assertSessionNotRevoked).mockReset().mockResolvedValue(undefined);
  vi.mocked(createTeacher).mockResolvedValue(rana);
  vi.mocked(setUserStatus).mockResolvedValue(undefined);
  vi.mocked(updateSchool).mockResolvedValue(school({ id: 'school-a' }));
  vi.mocked(setClassTeachers).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const ACTIONS = [
  [
    'createTeacherAction',
    () => createTeacherAction({ displayName: 'Ms Haddad', email: 'rana@school.test' }),
    createTeacher,
  ],
  [
    'setSchoolUserStatusAction',
    () => setSchoolUserStatusAction({ uid: 'u-1', status: 'disabled' }),
    setUserStatus,
  ],
  [
    'updateSchoolSettingsAction',
    () => updateSchoolSettingsAction({ name: 'Demo Academy' }),
    updateSchool,
  ],
  [
    'setClassTeachersAction',
    () => setClassTeachersAction({ classId: 'c1', teacherUids: ['t1', 't2'] }),
    setClassTeachers,
  ],
] as const satisfies readonly (readonly [string, () => Promise<ActionResult<unknown>>, unknown])[];

const OTHER_ROLES: Role[] = ['student', 'teacher', 'platform_admin'];

describe.each(ACTIONS)('%s roles (ARCHITECTURE.md 10.4)', (_name, call, service) => {
  it('lets a school admin through, once the session passed the revocation check', async () => {
    signIn('school_admin');
    const result = await call();
    expect(result.ok).toBe(true);
    expect(service).toHaveBeenCalledTimes(1);
    expect(assertSessionNotRevoked).toHaveBeenCalledTimes(1);
  });

  it.each(OTHER_ROLES)('refuses a %s', async (role) => {
    signIn(role);
    expect(await call()).toEqual({ ok: false, error: { code: 'forbidden' } });
    for (const mock of serviceMocks) expect(mock).not.toHaveBeenCalled();
  });

  it('answers unauthenticated without a session', async () => {
    signIn(null);
    expect(await call()).toEqual({ ok: false, error: { code: 'unauthenticated' } });
    for (const mock of serviceMocks) expect(mock).not.toHaveBeenCalled();
  });
});

describe('createTeacherAction', () => {
  it('trims and lower-cases, and takes the school from the session, never the payload', async () => {
    const result = await createTeacherAction({
      displayName: ' Ms Haddad ',
      email: ' Rana@School.TEST ',
      schoolId: 'other',
    } as never);
    expect(result).toEqual({ ok: true, data: { uid: 't-1', email: 'rana@school.test' } });
    expect(createTeacher).toHaveBeenCalledWith(admin, {
      displayName: 'Ms Haddad',
      email: 'rana@school.test',
      schoolId: 'school-a',
    });
  });

  it('answers the typed email when the profile has none', async () => {
    vi.mocked(createTeacher).mockResolvedValueOnce(profile({ ...rana, email: null }));
    expect(
      await createTeacherAction({ displayName: 'Ms Haddad', email: 'rana@school.test' }),
    ).toEqual({ ok: true, data: { uid: 't-1', email: 'rana@school.test' } });
  });

  it('refuses a school admin without a school', async () => {
    vi.mocked(getSession).mockResolvedValue(schoolless);
    expect(
      failure(await createTeacherAction({ displayName: 'Ms Haddad', email: 'rana@school.test' }))
        .code,
    ).toBe('forbidden');
    expect(createTeacher).not.toHaveBeenCalled();
  });

  it('refuses an invalid email and a short name before any call', async () => {
    expect(failure(await createTeacherAction({ displayName: 'Ms Haddad', email: 'nope' }))).toEqual({
      code: 'validation',
      fieldErrors: { email: ['invalid_email'] },
    });
    expect(failure(await createTeacherAction({ displayName: 'A', email: 'rana@school.test' }))).toEqual(
      { code: 'validation', fieldErrors: { displayName: ['display_name_length'] } },
    );
    expect(createTeacher).not.toHaveBeenCalled();
  });

  it('passes conflict, not_found and forbidden through, and hides anything else as internal', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const input = { displayName: 'Ms Haddad', email: 'rana@school.test' };
    vi.mocked(createTeacher).mockRejectedValueOnce(new ConflictError('exists'));
    expect(failure(await createTeacherAction(input)).code).toBe('conflict');
    vi.mocked(createTeacher).mockRejectedValueOnce(new NotFoundError('school'));
    expect(failure(await createTeacherAction(input)).code).toBe('not_found');
    vi.mocked(createTeacher).mockRejectedValueOnce(new ForbiddenError('no'));
    expect(failure(await createTeacherAction(input)).code).toBe('forbidden');
    vi.mocked(createTeacher).mockRejectedValueOnce(new Error('boom'));
    expect(failure(await createTeacherAction(input)).code).toBe('internal');
  });
});

describe('setSchoolUserStatusAction', () => {
  it('hands the uid and the status to the service', async () => {
    expect(await setSchoolUserStatusAction({ uid: 'u-1', status: 'disabled' })).toEqual({
      ok: true,
      data: null,
    });
    expect(setUserStatus).toHaveBeenCalledWith(admin, 'u-1', 'disabled');
  });

  it('refuses an unknown status and a malformed uid before any call', async () => {
    expect(
      failure(await setSchoolUserStatusAction({ uid: 'u-1', status: 'banned' } as never)),
    ).toEqual({ code: 'validation', fieldErrors: { status: ['invalid_choice'] } });
    expect(failure(await setSchoolUserStatusAction({ uid: 'a/b', status: 'active' })).code).toBe(
      'validation',
    );
    expect(setUserStatus).not.toHaveBeenCalled();
  });

  it('passes forbidden and not_found through', async () => {
    vi.mocked(setUserStatus).mockRejectedValueOnce(new ForbiddenError('own account'));
    expect(failure(await setSchoolUserStatusAction({ uid: 'u-1', status: 'disabled' })).code).toBe(
      'forbidden',
    );
    vi.mocked(setUserStatus).mockRejectedValueOnce(new NotFoundError('gone'));
    expect(failure(await setSchoolUserStatusAction({ uid: 'u-1', status: 'disabled' })).code).toBe(
      'not_found',
    );
  });
});

describe('updateSchoolSettingsAction', () => {
  it('drops the country and sends the rest to the session’s school', async () => {
    const result = await updateSchoolSettingsAction({
      name: 'Demo Academy',
      city: null,
      defaultLocale: 'fr',
      country: 'FR',
      settings: SETTINGS,
    } as never);
    expect(result).toEqual({ ok: true, data: null });
    expect(updateSchool).toHaveBeenCalledWith(admin, 'school-a', {
      name: 'Demo Academy',
      city: null,
      defaultLocale: 'fr',
      settings: SETTINGS,
    });
    const patch = vi.mocked(updateSchool).mock.calls[0]![2];
    expect(patch).not.toHaveProperty('country');
  });

  it('sends only the keys it was given', async () => {
    expect(await updateSchoolSettingsAction({ settings: SETTINGS })).toEqual({
      ok: true,
      data: null,
    });
    const patch = vi.mocked(updateSchool).mock.calls[0]![2];
    expect(patch).toEqual({ settings: SETTINGS });
    expect(Object.keys(patch)).toEqual(['settings']);
  });

  it.each([
    [500, 'too_big'],
    [0, 'too_small'],
    [2.5, 'invalid_integer'],
  ])('refuses a daily limit of %s (%s) before any call', async (limit, key) => {
    expect(
      failure(
        await updateSchoolSettingsAction({
          settings: { ...SETTINGS, aiDailyMessageLimit: limit },
        }),
      ),
    ).toEqual({ code: 'validation', fieldErrors: { 'settings.aiDailyMessageLimit': [key] } });
    expect(updateSchool).not.toHaveBeenCalled();
  });

  it('refuses a blank name and an unknown language before any call', async () => {
    expect(failure(await updateSchoolSettingsAction({ name: ' ' }))).toEqual({
      code: 'validation',
      fieldErrors: { name: ['too_short'] },
    });
    expect(failure(await updateSchoolSettingsAction({ defaultLocale: 'de' } as never))).toEqual({
      code: 'validation',
      fieldErrors: { defaultLocale: ['invalid_choice'] },
    });
    expect(updateSchool).not.toHaveBeenCalled();
  });

  it('refuses a school admin without a school', async () => {
    vi.mocked(getSession).mockResolvedValue(schoolless);
    expect(failure(await updateSchoolSettingsAction({ name: 'Demo Academy' })).code).toBe(
      'forbidden',
    );
    expect(updateSchool).not.toHaveBeenCalled();
  });

  it('passes the repository’s validation and forbidden through', async () => {
    vi.mocked(updateSchool).mockRejectedValueOnce(new ValidationError('x', { name: ['too_long'] }));
    expect(failure(await updateSchoolSettingsAction({ name: 'Demo Academy' }))).toEqual({
      code: 'validation',
      fieldErrors: { name: ['too_long'] },
    });
    vi.mocked(updateSchool).mockRejectedValueOnce(new ForbiddenError('country'));
    expect(failure(await updateSchoolSettingsAction({ name: 'Demo Academy' })).code).toBe(
      'forbidden',
    );
  });
});

describe('setClassTeachersAction', () => {
  it('hands the class and the list to the service', async () => {
    expect(await setClassTeachersAction({ classId: 'c1', teacherUids: ['t1', 't2'] })).toEqual({
      ok: true,
      data: null,
    });
    expect(setClassTeachers).toHaveBeenCalledWith(admin, 'c1', ['t1', 't2']);
  });

  it('refuses an empty, an oversized and a duplicated list before any call', async () => {
    expect(failure(await setClassTeachersAction({ classId: 'c1', teacherUids: [] }))).toEqual({
      code: 'validation',
      fieldErrors: { teacherUids: ['required'] },
    });
    const six = ['t1', 't2', 't3', 't4', 't5', 't6'];
    expect(failure(await setClassTeachersAction({ classId: 'c1', teacherUids: six }))).toEqual({
      code: 'validation',
      fieldErrors: { teacherUids: ['too_many'] },
    });
    expect(
      failure(await setClassTeachersAction({ classId: 'c1', teacherUids: ['t1', 't1'] })),
    ).toEqual({ code: 'validation', fieldErrors: { teacherUids: ['duplicate'] } });
    expect(setClassTeachers).not.toHaveBeenCalled();
  });

  it('passes the service’s validation, conflict and not_found through', async () => {
    const input = { classId: 'c1', teacherUids: ['t1', 't2'] };
    vi.mocked(setClassTeachers).mockRejectedValueOnce(
      new ValidationError('x', { teacherUids: ['invalid_choice'] }),
    );
    expect(failure(await setClassTeachersAction(input))).toEqual({
      code: 'validation',
      fieldErrors: { teacherUids: ['invalid_choice'] },
    });
    vi.mocked(setClassTeachers).mockRejectedValueOnce(new ConflictError('owner missing'));
    expect(failure(await setClassTeachersAction(input)).code).toBe('conflict');
    vi.mocked(setClassTeachers).mockRejectedValueOnce(new NotFoundError('class'));
    expect(failure(await setClassTeachersAction(input)).code).toBe('not_found');
  });
});
