import { redirect } from 'next/navigation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { fail, ok } from '@/lib/actions/result';
import { runAction } from '@/lib/actions/run-action';
import { assertSessionNotRevoked, getSession } from '@/lib/actions/session-source';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  LicenseRequiredError,
  NotFoundError,
  RateLimitError,
  UnauthenticatedError,
  ValidationError,
} from '@/lib/errors';
import type { Role, Session } from '@/types';

vi.mock('next-intl/server', () => ({ getLocale: vi.fn(() => Promise.resolve('fr')) }));
vi.mock('@/lib/actions/session-source', () => ({
  getSession: vi.fn(),
  assertSessionNotRevoked: vi.fn(),
}));

const schema = z.object({ name: z.string().trim().min(2, 'display_name_length') });

function sessionOf(role: Role): Session {
  return {
    uid: `${role}-1`,
    role,
    schoolId: null,
    classIds: [],
    displayName: 'Sam',
    locale: 'en',
    ageBand: role === 'student' ? '13-15' : 'adult',
    avatarId: 'robot',
    verifiedEducator: false,
  };
}

function signIn(role: Role | null): void {
  vi.mocked(getSession).mockResolvedValue(role === null ? null : sessionOf(role));
}

const logged = vi.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => {
  vi.mocked(getSession).mockReset();
  vi.mocked(assertSessionNotRevoked).mockReset().mockResolvedValue(undefined);
  logged.mockClear();
});
afterEach(() => expect(logged).not.toHaveBeenCalled());

describe('ok and fail', () => {
  it('build the two shapes of an ActionResult', () => {
    expect(ok({ id: 'a' })).toEqual({ ok: true, data: { id: 'a' } });
    expect(ok(null)).toEqual({ ok: true, data: null });
    expect(fail('forbidden')).toEqual({ ok: false, error: { code: 'forbidden' } });
    expect(fail('rate_limited', { retryAfterSeconds: 30 })).toEqual({
      ok: false,
      error: { code: 'rate_limited', retryAfterSeconds: 30 },
    });
    expect(fail('validation', { fieldErrors: { name: ['required'] } })).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { name: ['required'] } },
    });
  });
});

describe('runAction', () => {
  it('rejects invalid input before looking at the session', async () => {
    const handler = vi.fn();
    const result = await runAction(schema, { name: ' a ' }, handler, { roles: ['student'] });
    expect(result).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { name: ['display_name_length'] } },
    });
    expect(getSession).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it('reports messages as validation keys even for a schema that set none', async () => {
    const result = await runAction(z.object({ count: z.number() }), {}, vi.fn(), {
      roles: ['student'],
    });
    expect(result).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { count: ['required'] } },
    });
  });

  it('requires a session', async () => {
    signIn(null);
    const handler = vi.fn();
    expect(await runAction(schema, { name: 'Sam' }, handler, { roles: ['student'] })).toEqual(
      fail('unauthenticated'),
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it('requires one of the listed roles', async () => {
    signIn('student');
    const handler = vi.fn();
    expect(
      await runAction(schema, { name: 'Sam' }, handler, { roles: ['teacher', 'platform_admin'] }),
    ).toEqual(fail('forbidden'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('gives the handler the parsed data, the session and the locale of the page', async () => {
    signIn('student');
    const handler = vi.fn((data: { name: string }, session: Session, ctx: { locale: string }) =>
      Promise.resolve(`${data.name}/${session.uid}/${ctx.locale}`),
    );
    expect(await runAction(schema, { name: '  Sam  ' }, handler, { roles: ['student'] })).toEqual(
      ok('Sam/student-1/fr'),
    );
    expect(assertSessionNotRevoked).not.toHaveBeenCalled();
  });

  it.each(['teacher', 'school_admin', 'platform_admin'] as const)(
    'checks a %s session against revocation',
    async (role) => {
      signIn(role);
      expect(
        await runAction(schema, { name: 'Sam' }, () => Promise.resolve(null), { roles: [role] }),
      ).toEqual(ok(null));
      expect(assertSessionNotRevoked).toHaveBeenCalledTimes(1);

      vi.mocked(assertSessionNotRevoked).mockRejectedValue(new UnauthenticatedError());
      const handler = vi.fn();
      expect(await runAction(schema, { name: 'Sam' }, handler, { roles: [role] })).toEqual(
        fail('unauthenticated'),
      );
      expect(handler).not.toHaveBeenCalled();
    },
  );

  it('runs an anonymous action without resolving a session', async () => {
    const handler = vi.fn((data: { name: string }, session: null) =>
      Promise.resolve({ name: data.name, session }),
    );
    expect(await runAction(schema, { name: 'Sam' }, handler, { allowAnonymous: true })).toEqual(
      ok({ name: 'Sam', session: null }),
    );
    expect(getSession).not.toHaveBeenCalled();
  });

  it.each([
    [new NotFoundError('submission abc'), fail('not_found')],
    [new ForbiddenError('submission.view'), fail('forbidden')],
    [new ConflictError(), fail('conflict')],
    [new LicenseRequiredError(), fail('license_required')],
    [new UnauthenticatedError(), fail('unauthenticated')],
    [new AppError('profile_missing'), fail('profile_missing')],
    [new AppError('email_unverified'), fail('email_unverified')],
    [new RateLimitError(42), fail('rate_limited', { retryAfterSeconds: 42 })],
    [new RateLimitError(null), fail('rate_limited')],
    [new ValidationError('bad'), fail('validation')],
    [
      new ValidationError('bad', { 'data.fileId': ['invalid'] }),
      fail('validation', { fieldErrors: { 'data.fileId': ['invalid'] } }),
    ],
  ])('maps %o to its error code', async (error, expected) => {
    signIn('student');
    const result = await runAction(schema, { name: 'Sam' }, () => Promise.reject(error), {
      roles: ['student'],
    });
    expect(result).toEqual(expected);
    expect(JSON.stringify(result)).not.toContain('submission');
  });

  it('logs an unexpected error and tells the client nothing about it', async () => {
    signIn('student');
    const result = await runAction(
      schema,
      { name: 'Sam' },
      () => Promise.reject(new Error('connection string leaked')),
      { roles: ['student'] },
    );
    expect(result).toEqual(fail('internal'));
    expect(logged).toHaveBeenCalledTimes(1);
    logged.mockClear();

    vi.mocked(getSession).mockRejectedValue(new Error('firestore unavailable'));
    expect(
      await runAction(schema, { name: 'Sam' }, () => Promise.resolve(1), { roles: ['student'] }),
    ).toEqual(fail('internal'));
    expect(logged).toHaveBeenCalledTimes(1);
    logged.mockClear();
  });

  it('lets a redirect thrown by the handler through', async () => {
    signIn('student');
    await expect(
      runAction(schema, { name: 'Sam' }, () => Promise.resolve(redirect('/en/student')), {
        roles: ['student'],
      }),
    ).rejects.toMatchObject({ digest: expect.stringContaining('NEXT_REDIRECT') });
  });
});
