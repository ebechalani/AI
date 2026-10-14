import { beforeEach, describe, expect, it, vi } from 'vitest';
import { completeSignupAction, joinClassSignupAction, lookupJoinCodeAction } from '@/actions/auth';
import { getSession } from '@/lib/actions/session-source';
import { ForbiddenError, NotFoundError, RateLimitError, ValidationError } from '@/lib/errors';
import { getClientKey } from '@/lib/request-meta';
import { lookupJoinCode } from '@/lib/services/classroom';
import { completeSignup, signUpWithJoinCode } from '@/lib/services/provisioning';

// The three anonymous actions of WS-A (ARCHITECTURE.md 10.4): what they hand to the services,
// what they answer, and that none of them looks for a session.

vi.mock('next-intl/server', () => ({ getLocale: vi.fn(() => Promise.resolve('en')) }));
vi.mock('@/lib/actions/session-source', () => ({
  getSession: vi.fn(),
  assertSessionNotRevoked: vi.fn(),
}));
vi.mock('@/lib/request-meta', () => ({ getClientKey: vi.fn(() => Promise.resolve('client-key')) }));
vi.mock('@/lib/services/classroom', () => ({ lookupJoinCode: vi.fn() }));
vi.mock('@/lib/services/provisioning', () => ({
  completeSignup: vi.fn(),
  signUpWithJoinCode: vi.fn(),
}));

const signup = {
  idToken: 'fresh-id-token',
  displayName: 'Sam Rivera',
  role: 'student' as const,
  ageBand: '13-15' as const,
  locale: 'en' as const,
  acceptedTerms: true as const,
};

const joinSignup = {
  joinCode: 'rbhd-em23',
  displayName: 'Lea Demo',
  username: 'Lea.Demo',
  password: 'a-long-password',
  ageBand: '11-12' as const,
  locale: 'fr' as const,
  acceptedTerms: true as const,
};

beforeEach(() => {
  vi.mocked(getSession).mockReset();
  vi.mocked(completeSignup).mockReset();
  vi.mocked(signUpWithJoinCode).mockReset();
  vi.mocked(lookupJoinCode).mockReset();
  vi.mocked(getClientKey).mockClear();
});

describe('completeSignupAction', () => {
  it('writes the profile with the token and the client key, then points at /verify-email', async () => {
    vi.mocked(completeSignup).mockResolvedValue({} as never);
    const result = await completeSignupAction(signup);
    expect(result).toEqual({ ok: true, data: { redirectTo: '/verify-email' } });
    expect(completeSignup).toHaveBeenCalledWith(
      'fresh-id-token',
      expect.objectContaining({ displayName: 'Sam Rivera', role: 'student', ageBand: '13-15' }),
      { clientKey: 'client-key' },
    );
    expect(getSession).not.toHaveBeenCalled();
  });

  it('refuses an under-13 self sign-up before reaching the service', async () => {
    const result = await completeSignupAction({ ...signup, ageBand: '8-10' });
    expect(result).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { ageBand: ['age_band_not_allowed'] } },
    });
    expect(completeSignup).not.toHaveBeenCalled();
  });

  it('forces the adult band on a teacher', async () => {
    const result = await completeSignupAction({ ...signup, role: 'teacher', ageBand: '16-18' });
    expect(result).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { ageBand: ['age_band_not_allowed'] } },
    });
  });

  it('requires the terms to be accepted', async () => {
    const result = await completeSignupAction({ ...signup, acceptedTerms: false } as never);
    expect(result).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { acceptedTerms: ['terms_required'] } },
    });
  });

  it('passes the service codes through (forbidden, conflict, rate limit)', async () => {
    vi.mocked(completeSignup).mockRejectedValueOnce(new ForbiddenError('username token'));
    expect(await completeSignupAction(signup)).toEqual({ ok: false, error: { code: 'forbidden' } });

    vi.mocked(completeSignup).mockRejectedValueOnce(new RateLimitError(120));
    expect(await completeSignupAction(signup)).toEqual({
      ok: false,
      error: { code: 'rate_limited', retryAfterSeconds: 120 },
    });
  });
});

describe('lookupJoinCodeAction', () => {
  it('normalises the code and returns what the class allows', async () => {
    vi.mocked(lookupJoinCode).mockResolvedValue({
      className: 'Grade 6 A',
      accountCreation: true,
      under13Allowed: true,
    });
    const result = await lookupJoinCodeAction({ joinCode: ' rbhd-em23 ' });
    expect(result).toEqual({
      ok: true,
      data: { className: 'Grade 6 A', accountCreation: true, under13Allowed: true },
    });
    expect(lookupJoinCode).toHaveBeenCalledWith('RBHDEM23', { clientKey: 'client-key' });
    expect(getSession).not.toHaveBeenCalled();
  });

  it('rejects a malformed code as a field error without calling the service', async () => {
    const result = await lookupJoinCodeAction({ joinCode: 'ABC' });
    expect(result).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { joinCode: ['join_code_invalid'] } },
    });
    expect(lookupJoinCode).not.toHaveBeenCalled();
  });

  it('answers not_found for an unknown code', async () => {
    vi.mocked(lookupJoinCode).mockRejectedValue(new NotFoundError('no such code'));
    expect(await lookupJoinCodeAction({ joinCode: 'RBHDEM23' })).toEqual({
      ok: false,
      error: { code: 'not_found' },
    });
  });
});

describe('joinClassSignupAction', () => {
  it('creates the account with the normalised code and username', async () => {
    vi.mocked(signUpWithJoinCode).mockResolvedValue({ username: 'lea.demo' });
    const result = await joinClassSignupAction(joinSignup);
    expect(result).toEqual({ ok: true, data: { username: 'lea.demo' } });
    expect(signUpWithJoinCode).toHaveBeenCalledWith(
      expect.objectContaining({ joinCode: 'RBHDEM23', username: 'lea.demo', ageBand: '11-12' }),
      { clientKey: 'client-key' },
    );
    expect(getSession).not.toHaveBeenCalled();
  });

  it('reports a taken username as a field error', async () => {
    vi.mocked(signUpWithJoinCode).mockRejectedValue(
      new ValidationError('taken', { username: ['duplicate'] }),
    );
    expect(await joinClassSignupAction(joinSignup)).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { username: ['duplicate'] } },
    });
  });

  it('refuses a short password before reaching the service', async () => {
    const result = await joinClassSignupAction({ ...joinSignup, password: 'short' });
    expect(result).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { password: ['password_too_short'] } },
    });
    expect(signUpWithJoinCode).not.toHaveBeenCalled();
  });
});
