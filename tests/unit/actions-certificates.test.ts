import { beforeEach, describe, expect, it, vi } from 'vitest';
import { issueCertificateAction, revokeCertificateAction } from '@/actions/certificates';
import { assertSessionNotRevoked, getSession } from '@/lib/actions/session-source';
import { ConflictError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { issueCertificate, revokeCertificate } from '@/lib/services/recognition';
import type { Role } from '@/types';
import { certificate, session as sessionOf } from './services-fixtures';

// The certificate actions (ARCHITECTURE.md 10.4, 9.5): teachers and platform admins issue and
// revoke; the recognition service decides who may, for which certificate.

vi.mock('next-intl/server', () => ({ getLocale: vi.fn(() => Promise.resolve('en')) }));
vi.mock('@/lib/actions/session-source', () => ({
  getSession: vi.fn(),
  assertSessionNotRevoked: vi.fn(),
}));
vi.mock('@/lib/services/recognition', () => ({
  issueCertificate: vi.fn(),
  revokeCertificate: vi.fn(),
}));

const CERTIFICATE_ID = 'student-1_course-1';
const issue = { studentUid: 'student-1', courseId: 'course-1' };
const revoke = { certificateId: CERTIFICATE_ID, reason: 'Issued by mistake' };

function signIn(role: Role | null): void {
  vi.mocked(getSession).mockResolvedValue(role === null ? null : sessionOf(role, `${role}-1`));
}

beforeEach(() => {
  vi.mocked(issueCertificate)
    .mockReset()
    .mockResolvedValue(certificate({ id: CERTIFICATE_ID }));
  vi.mocked(revokeCertificate).mockReset().mockResolvedValue(undefined);
  vi.mocked(getSession).mockReset();
  vi.mocked(assertSessionNotRevoked).mockReset().mockResolvedValue(undefined);
  signIn('teacher');
});

describe('issueCertificateAction', () => {
  it.each<Role>(['teacher', 'platform_admin'])(
    'lets a %s issue and answers the certificate id',
    async (role) => {
      signIn(role);
      expect(await issueCertificateAction(issue)).toEqual({
        ok: true,
        data: { certificateId: CERTIFICATE_ID },
      });
      expect(issueCertificate).toHaveBeenCalledWith(sessionOf(role, `${role}-1`), issue);
      // Staff sessions are checked against revocation before any mutation.
      expect(assertSessionNotRevoked).toHaveBeenCalled();
    },
  );

  it.each<Role>(['student', 'school_admin'])('refuses a %s', async (role) => {
    signIn(role);
    expect(await issueCertificateAction(issue)).toEqual({
      ok: false,
      error: { code: 'forbidden' },
    });
    expect(issueCertificate).not.toHaveBeenCalled();
  });

  it('answers unauthenticated without a session', async () => {
    signIn(null);
    expect(await issueCertificateAction(issue)).toEqual({
      ok: false,
      error: { code: 'unauthenticated' },
    });
    expect(issueCertificate).not.toHaveBeenCalled();
  });

  it('refuses a malformed id before any call', async () => {
    const result = await issueCertificateAction({ ...issue, studentUid: 'bad id' });
    expect(result).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { studentUid: ['invalid'] } },
    });
    expect(issueCertificate).not.toHaveBeenCalled();
  });

  it.each([
    [new ConflictError(), 'conflict'],
    [new NotFoundError(), 'not_found'],
    [new ForbiddenError(), 'forbidden'],
    [new Error('boom'), 'internal'],
  ] as const)('maps %s to %s', async (error, code) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(issueCertificate).mockRejectedValue(error);
    expect(await issueCertificateAction(issue)).toEqual({ ok: false, error: { code } });
  });
});

describe('revokeCertificateAction', () => {
  it.each<Role>(['teacher', 'platform_admin'])(
    'lets a %s revoke with the trimmed reason',
    async (role) => {
      signIn(role);
      expect(await revokeCertificateAction({ ...revoke, reason: '  Issued by mistake  ' })).toEqual(
        { ok: true, data: null },
      );
      expect(revokeCertificate).toHaveBeenCalledWith(
        sessionOf(role, `${role}-1`),
        CERTIFICATE_ID,
        'Issued by mistake',
      );
    },
  );

  it.each<Role>(['student', 'school_admin'])('refuses a %s', async (role) => {
    signIn(role);
    expect(await revokeCertificateAction(revoke)).toEqual({
      ok: false,
      error: { code: 'forbidden' },
    });
    expect(revokeCertificate).not.toHaveBeenCalled();
  });

  it('answers unauthenticated without a session', async () => {
    signIn(null);
    expect(await revokeCertificateAction(revoke)).toEqual({
      ok: false,
      error: { code: 'unauthenticated' },
    });
  });

  it('requires a reason of at most 500 characters', async () => {
    expect(await revokeCertificateAction({ ...revoke, reason: '   ' })).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { reason: ['required'] } },
    });
    expect(await revokeCertificateAction({ ...revoke, reason: 'x'.repeat(501) })).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { reason: ['too_long'] } },
    });
    expect(revokeCertificate).not.toHaveBeenCalled();
  });

  it('refuses a malformed certificate id', async () => {
    const result = await revokeCertificateAction({ ...revoke, certificateId: '../other' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('validation');
    expect(result.error.fieldErrors?.certificateId).toBeDefined();
    expect(revokeCertificate).not.toHaveBeenCalled();
  });

  it.each([
    [new ForbiddenError(), 'forbidden'],
    [new NotFoundError(), 'not_found'],
  ] as const)('maps %s to %s', async (error, code) => {
    vi.mocked(revokeCertificate).mockRejectedValue(error);
    expect(await revokeCertificateAction(revoke)).toEqual({ ok: false, error: { code } });
  });
});
