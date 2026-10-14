import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SYSTEM_ACTOR } from '@/lib/auth/actor';
import { syncClaims } from '@/lib/auth/claims';
import { adjustSchoolCounts, getSchool } from '@/lib/data/schools';
import { getUser, setIdentity, setSessionsValidAfter } from '@/lib/data/users';
import { NotFoundError } from '@/lib/errors';
import { getAdminAuth } from '@/lib/firebase/admin';
import { applyIdentityChange, countedIn, invalidateSessions } from '@/lib/services/identity';
import type { School, UserProfile } from '@/types';

// services/identity over mocked repositories: which school counter a change moves, that the
// profile is written before the session invalidation and the counters, and what ends every
// session. The repositories run against the emulator in tests/integration.

vi.mock('@/lib/firebase/admin', () => ({
  getAdminAuth: vi.fn(),
  getAdminDb: vi.fn(() => {
    throw new Error('Firestore was reached.');
  }),
}));
vi.mock('@/lib/auth/claims', () => ({ syncClaims: vi.fn() }));
vi.mock('@/lib/data/users', () => ({
  getUser: vi.fn(),
  setIdentity: vi.fn(),
  setSessionsValidAfter: vi.fn(),
}));
vi.mock('@/lib/data/schools', () => ({ getSchool: vi.fn(), adjustSchoolCounts: vi.fn() }));

const NOW = '2026-10-02T08:00:00.000Z';
const UID = 'user-1';

function profile(fields: Partial<UserProfile> = {}): UserProfile {
  return {
    id: UID,
    role: 'student',
    schoolId: null,
    displayName: 'Lea M',
    username: 'lea.m',
    email: null,
    ageBand: '11-12',
    locale: 'en',
    avatarId: 'robot',
    status: 'active',
    classIds: [],
    consentBasis: 'school',
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

const revokeRefreshTokens = vi.fn();
let log: string[];

beforeEach(() => {
  vi.clearAllMocks();
  log = [];
  vi.mocked(getAdminAuth).mockReturnValue({ revokeRefreshTokens } as unknown as ReturnType<
    typeof getAdminAuth
  >);
  revokeRefreshTokens.mockImplementation(async () => {
    log.push('revoke');
  });
  vi.mocked(setSessionsValidAfter).mockImplementation(async () => {
    log.push('validAfter');
  });
  vi.mocked(setIdentity).mockImplementation(async () => {
    log.push('setIdentity');
  });
  vi.mocked(adjustSchoolCounts).mockImplementation(async (_actor, schoolId, delta) => {
    log.push(`counts ${schoolId} ${JSON.stringify(delta)}`);
  });
  vi.mocked(syncClaims).mockImplementation(async () => {
    log.push('claims');
  });
  vi.mocked(getSchool).mockResolvedValue({ id: 'school-a' } as School);
});

describe('countedIn', () => {
  it('counts active students and teachers of a school, nobody else', () => {
    expect(countedIn({ role: 'student', schoolId: 'school-a', status: 'active' })).toEqual({
      schoolId: 'school-a',
      counter: 'students',
    });
    expect(countedIn({ role: 'teacher', schoolId: 'school-a', status: 'active' })).toEqual({
      schoolId: 'school-a',
      counter: 'teachers',
    });
    expect(countedIn({ role: 'school_admin', schoolId: 'school-a', status: 'active' })).toBeNull();
    expect(countedIn({ role: 'platform_admin', schoolId: null, status: 'active' })).toBeNull();
    expect(countedIn({ role: 'student', schoolId: 'school-a', status: 'disabled' })).toBeNull();
    expect(countedIn({ role: 'student', schoolId: null, status: 'active' })).toBeNull();
  });
});

describe('invalidateSessions', () => {
  it('writes sessionsValidAfter to the profile, then revokes the refresh tokens', async () => {
    await invalidateSessions(UID);
    expect(log).toEqual(['validAfter', 'revoke']);
    expect(setSessionsValidAfter).toHaveBeenCalledWith(SYSTEM_ACTOR, UID, expect.any(Date));
    expect(revokeRefreshTokens).toHaveBeenCalledWith(UID);
  });

  it('accepts an Auth account that no longer exists, and nothing else', async () => {
    revokeRefreshTokens.mockRejectedValueOnce({ code: 'auth/user-not-found' });
    await expect(invalidateSessions(UID)).resolves.toBeUndefined();
    revokeRefreshTokens.mockRejectedValueOnce(new Error('network'));
    await expect(invalidateSessions(UID)).rejects.toThrow('network');
  });
});

describe('applyIdentityChange', () => {
  it('attaches a student to a school: the school must exist, the counter goes up, no session ends', async () => {
    vi.mocked(getUser).mockResolvedValue(profile());
    await applyIdentityChange(UID, { schoolId: 'school-a' }, { invalidateSessions: false });

    expect(getSchool).toHaveBeenCalledWith(SYSTEM_ACTOR, 'school-a');
    expect(setIdentity).toHaveBeenCalledWith(SYSTEM_ACTOR, UID, {
      role: 'student',
      schoolId: 'school-a',
      status: 'active',
    });
    expect(log).toEqual(['setIdentity', 'counts school-a {"students":1}', 'claims']);
    expect(revokeRefreshTokens).not.toHaveBeenCalled();
  });

  it('refuses a school that does not exist before touching the profile', async () => {
    vi.mocked(getUser).mockResolvedValue(profile());
    vi.mocked(getSchool).mockRejectedValue(new NotFoundError('no school'));
    await expect(
      applyIdentityChange(UID, { schoolId: 'ghost' }, { invalidateSessions: false }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(setIdentity).not.toHaveBeenCalled();
    expect(syncClaims).not.toHaveBeenCalled();
  });

  it('moves a promoted user between the counters and ends their sessions right after the profile write', async () => {
    vi.mocked(getUser).mockResolvedValue(profile({ schoolId: 'school-a' }));
    await applyIdentityChange(UID, { role: 'teacher' }, { invalidateSessions: true });

    expect(getSchool).not.toHaveBeenCalled();
    expect(log).toEqual([
      'setIdentity',
      'validAfter',
      'revoke',
      'counts school-a {"students":-1}',
      'counts school-a {"teachers":1}',
      'claims',
    ]);
  });

  it('takes a disabled student out of the seats and puts a re-enabled one back', async () => {
    vi.mocked(getUser).mockResolvedValue(profile({ schoolId: 'school-a' }));
    await applyIdentityChange(UID, { status: 'disabled' }, { invalidateSessions: true });
    expect(adjustSchoolCounts).toHaveBeenCalledWith(SYSTEM_ACTOR, 'school-a', { students: -1 });

    vi.mocked(getUser).mockResolvedValue(profile({ schoolId: 'school-a', status: 'disabled' }));
    await applyIdentityChange(UID, { status: 'active' }, { invalidateSessions: false });
    expect(adjustSchoolCounts).toHaveBeenLastCalledWith(SYSTEM_ACTOR, 'school-a', {
      students: 1,
    });
  });

  it('detaches a student from their school without reading it', async () => {
    vi.mocked(getUser).mockResolvedValue(profile({ schoolId: 'school-a' }));
    await applyIdentityChange(UID, { schoolId: null }, { invalidateSessions: false });
    expect(getSchool).not.toHaveBeenCalled();
    expect(adjustSchoolCounts).toHaveBeenCalledWith(SYSTEM_ACTOR, 'school-a', { students: -1 });
    expect(setIdentity).toHaveBeenCalledWith(SYSTEM_ACTOR, UID, {
      role: 'student',
      schoolId: null,
      status: 'active',
    });
  });

  it('does not count a school admin or an unchanged identity, but always refreshes the claims', async () => {
    vi.mocked(getUser).mockResolvedValue(profile({ role: 'school_admin', schoolId: 'school-a' }));
    await applyIdentityChange(UID, { schoolId: 'school-b' }, { invalidateSessions: false });
    expect(adjustSchoolCounts).not.toHaveBeenCalled();

    vi.mocked(getUser).mockResolvedValue(profile({ schoolId: 'school-a' }));
    await applyIdentityChange(UID, { role: 'student' }, { invalidateSessions: false });
    expect(adjustSchoolCounts).not.toHaveBeenCalled();
    expect(syncClaims).toHaveBeenCalledTimes(2);
  });
});
