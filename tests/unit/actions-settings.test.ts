import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateProfileAction } from '@/actions/settings';
import { assertSessionNotRevoked, getSession } from '@/lib/actions/session-source';
import { updateProfile } from '@/lib/data/users';
import { NotFoundError } from '@/lib/errors';
import { ROLES, type ProfilePatch, type Role } from '@/types';
import { profile, session as sessionOf } from './services-fixtures';

// The profile action (ARCHITECTURE.md 10.4): every role edits its own name, language and
// avatar, never anyone else's; it is also every shell's `persistLocale`.

vi.mock('next-intl/server', () => ({ getLocale: vi.fn(() => Promise.resolve('en')) }));
vi.mock('@/lib/actions/session-source', () => ({
  getSession: vi.fn(),
  assertSessionNotRevoked: vi.fn(),
}));
vi.mock('@/lib/data/users', () => ({ updateProfile: vi.fn() }));

function signIn(role: Role | null, uid = `${role}-1`): void {
  vi.mocked(getSession).mockResolvedValue(role === null ? null : sessionOf(role, uid));
}

beforeEach(() => {
  vi.mocked(updateProfile)
    .mockReset()
    .mockResolvedValue(profile({ id: 'student-1' }));
  vi.mocked(getSession).mockReset();
  // runAction checks every non-student session against revocation.
  vi.mocked(assertSessionNotRevoked).mockReset().mockResolvedValue(undefined);
  signIn('student');
});

describe('updateProfileAction', () => {
  it.each<Role>([...ROLES])('lets a %s update their own profile', async (role) => {
    signIn(role);
    expect(await updateProfileAction({ avatarId: 'atom' })).toEqual({ ok: true, data: null });
    expect(updateProfile).toHaveBeenCalledWith(sessionOf(role, `${role}-1`), `${role}-1`, {
      avatarId: 'atom',
    });
  });

  it('answers unauthenticated without a session', async () => {
    signIn(null);
    expect(await updateProfileAction({ avatarId: 'atom' })).toEqual({
      ok: false,
      error: { code: 'unauthenticated' },
    });
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('trims the display name', async () => {
    expect(await updateProfileAction({ displayName: '  Ada L.  ' })).toEqual({
      ok: true,
      data: null,
    });
    expect(updateProfile).toHaveBeenCalledWith(sessionOf('student', 'student-1'), 'student-1', {
      displayName: 'Ada L.',
    });
  });

  it('passes the language switcher’s { locale } alone', async () => {
    expect((await updateProfileAction({ locale: 'fr' })).ok).toBe(true);
    expect(updateProfile).toHaveBeenCalledWith(sessionOf('student', 'student-1'), 'student-1', {
      locale: 'fr',
    });
  });

  it('refuses invalid fields without a write', async () => {
    expect(await updateProfileAction({ avatarId: 'unicorn' })).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { avatarId: ['invalid_choice'] } },
    });
    expect(await updateProfileAction({ displayName: 'A' })).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { displayName: ['display_name_length'] } },
    });
    const locale = await updateProfileAction({ locale: 'de' } as unknown as ProfilePatch);
    expect(locale.ok).toBe(false);
    if (!locale.ok) {
      expect(locale.error.code).toBe('validation');
      expect(locale.error.fieldErrors?.locale).toBeDefined();
    }
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('drops smuggled keys and always writes the session’s own profile', async () => {
    const input = { uid: 'other', role: 'platform_admin', xpTotal: 9, displayName: 'Ada L.' };
    expect((await updateProfileAction(input as unknown as ProfilePatch)).ok).toBe(true);
    expect(updateProfile).toHaveBeenCalledWith(sessionOf('student', 'student-1'), 'student-1', {
      displayName: 'Ada L.',
    });
  });

  it('answers an empty patch without a write', async () => {
    expect(await updateProfileAction({})).toEqual({ ok: true, data: null });
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('answers not_found when the profile is gone', async () => {
    vi.mocked(updateProfile).mockRejectedValue(new NotFoundError());
    expect(await updateProfileAction({ avatarId: 'atom' })).toEqual({
      ok: false,
      error: { code: 'not_found' },
    });
  });
});
