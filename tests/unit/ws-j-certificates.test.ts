import { describe, expect, it } from 'vitest';
import {
  certificateActions,
  certificateBackLink,
  certificateTitle,
  issueProblem,
  normalizeVerificationCode,
  revokeProblem,
  verifyUrl,
} from '@/components/certificates/certificate-model';
import type { ActionErrorCode, Role } from '@/types';
import { certificate } from './services-fixtures';

// The certificates' pure model (ARCHITECTURE.md 6.1, 9.5, 12 "Certificates").

const viewer = (role: Role, uid = `${role}-1`) => ({ role, uid });

describe('verifyUrl', () => {
  it('is locale-less and strips trailing slashes', () => {
    expect(verifyUrl('http://localhost:3100/', 'RH-ABCDEFGHJK')).toBe(
      'http://localhost:3100/verify/RH-ABCDEFGHJK',
    );
    expect(verifyUrl('https://roboholic.ai', 'RH-ABCDEFGHJK')).toBe(
      'https://roboholic.ai/verify/RH-ABCDEFGHJK',
    );
  });
});

describe('normalizeVerificationCode', () => {
  it('decodes, trims, upper-cases and caps the segment', () => {
    expect(normalizeVerificationCode(' rh-abcdefghjk ')).toBe('RH-ABCDEFGHJK');
    expect(normalizeVerificationCode('%20rh-abcdefghjk')).toBe('RH-ABCDEFGHJK');
    expect(() => normalizeVerificationCode('%E0%A4%A')).not.toThrow();
    expect(normalizeVerificationCode('%E0%A4%A')).toBe('%E0%A4%A');
    expect(normalizeVerificationCode('x'.repeat(600))).toHaveLength(40);
  });
});

describe('certificateTitle', () => {
  it('falls back to English', () => {
    const shown = certificate({ id: 'c', courseTitle: { en: { title: 'AI basics' } } });
    expect(certificateTitle(shown, 'fr')).toBe('AI basics');
    const both = certificate({
      id: 'c',
      courseTitle: { en: { title: 'AI basics' }, fr: { title: 'Bases de l’IA' } },
    });
    expect(certificateTitle(both, 'fr')).toBe('Bases de l’IA');
  });
});

describe('certificateActions', () => {
  const issued = { status: 'issued', issuedBy: 'teacher-1' } as const;
  const revoked = { status: 'revoked', issuedBy: 'teacher-1' } as const;

  it('lets the issuing teacher and platform admins revoke or issue again', () => {
    expect(certificateActions(viewer('teacher'), issued)).toEqual({
      canRevoke: true,
      canReissue: false,
    });
    expect(certificateActions(viewer('teacher'), revoked)).toEqual({
      canRevoke: false,
      canReissue: true,
    });
    expect(certificateActions(viewer('platform_admin'), issued)).toEqual({
      canRevoke: true,
      canReissue: false,
    });
    expect(certificateActions(viewer('platform_admin'), revoked)).toEqual({
      canRevoke: false,
      canReissue: true,
    });
  });

  it('gives nobody else either action', () => {
    const none = { canRevoke: false, canReissue: false };
    expect(certificateActions(viewer('teacher', 'teacher-2'), issued)).toEqual(none);
    expect(certificateActions(viewer('teacher'), { ...issued, issuedBy: 'system' })).toEqual(none);
    expect(certificateActions(viewer('student', 'teacher-1'), issued)).toEqual(none);
    expect(certificateActions(viewer('school_admin'), issued)).toEqual(none);
    expect(certificateActions(viewer('school_admin'), revoked)).toEqual(none);
  });
});

describe('certificateBackLink', () => {
  it('sends each viewer back to their list', () => {
    const owned = { userUid: 'student-1' };
    expect(certificateBackLink(viewer('student', 'student-1'), owned)).toEqual({
      href: '/student/certificates',
      key: 'student',
    });
    expect(certificateBackLink(viewer('teacher'), { userUid: 'teacher-1' })).toEqual({
      href: '/teacher/settings',
      key: 'teacherOwn',
    });
    expect(certificateBackLink(viewer('teacher'), owned)).toEqual({
      href: '/teacher/reports',
      key: 'teacher',
    });
    expect(certificateBackLink(viewer('school_admin'), owned)).toEqual({
      href: '/school/certificates',
      key: 'school_admin',
    });
    expect(certificateBackLink(viewer('platform_admin'), owned)).toEqual({
      href: '/admin/certificates',
      key: 'platform_admin',
    });
  });
});

describe('issueProblem and revokeProblem', () => {
  it('map every code the dialogs handle', () => {
    const issue = (code: ActionErrorCode) => issueProblem({ code });
    expect(issue('validation')).toBe('invalid');
    expect(issue('conflict')).toBe('conflict');
    expect(issue('forbidden')).toBe('forbidden');
    expect(issue('not_found')).toBe('notFound');
    expect(issue('unauthenticated')).toBe('session');
    expect(issue('internal')).toBeNull();
    expect(issue('rate_limited')).toBeNull();
  });

  it('puts a reason error under the field, anything else in the alert', () => {
    expect(revokeProblem({ code: 'validation', fieldErrors: { reason: ['required'] } })).toBe(
      'field',
    );
    expect(
      revokeProblem({
        code: 'validation',
        fieldErrors: { reason: ['too_long'], certificateId: ['invalid'] },
      }),
    ).toBe('invalid');
    expect(revokeProblem({ code: 'validation' })).toBe('invalid');
    expect(revokeProblem({ code: 'forbidden' })).toBe('forbidden');
    expect(revokeProblem({ code: 'not_found' })).toBe('notFound');
    expect(revokeProblem({ code: 'unauthenticated' })).toBe('session');
    expect(revokeProblem({ code: 'internal' })).toBeNull();
    expect(revokeProblem({ code: 'conflict' })).toBeNull();
  });
});
