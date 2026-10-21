import { pickTranslation } from '@/lib/i18n/content';
import type { ActionError } from '@/types/actions';
import type { Certificate } from '@/types/gamification';
import type { Session } from '@/types/user';

// Certificates as plain data: the verification URL, the code as typed in a URL, who may do what
// on the printable page, and how action errors are shown (ARCHITECTURE.md 6.1, 9.5, 12).

/** `${appUrl}/verify/${code}`: locale-less, so the next-intl middleware picks the reader's language. */
export function verifyUrl(appUrl: string, code: string): string {
  return `${appUrl.replace(/\/+$/, '')}/verify/${encodeURIComponent(code)}`;
}

/** The longest code the verify page echoes back (a real code has 13 characters). */
export const CODE_DISPLAY_MAX = 40;

/** The URL segment as the repository wants it: decoded (bad escapes kept as typed), trimmed, upper-cased, ≤ 40 chars. */
export function normalizeVerificationCode(raw: string): string {
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // A malformed escape ("%E0%A4%A") is kept as typed; it matches no certificate anyway.
  }
  return decoded.trim().toUpperCase().slice(0, CODE_DISPLAY_MAX);
}

/** The course title in the viewer's language, English as the fallback. */
export function certificateTitle(
  certificate: Pick<Certificate, 'courseTitle'>,
  locale: string,
): string {
  return pickTranslation(certificate.courseTitle, locale, 'en').title ?? '';
}

/** Revoke: an issued certificate, for a platform admin or the teacher who issued it. Issue again: a revoked one, same people. */
export function certificateActions(
  viewer: Pick<Session, 'uid' | 'role'>,
  certificate: Pick<Certificate, 'status' | 'issuedBy'>,
): { canRevoke: boolean; canReissue: boolean } {
  const allowed =
    viewer.role === 'platform_admin' ||
    (viewer.role === 'teacher' && certificate.issuedBy === viewer.uid);
  return {
    canRevoke: allowed && certificate.status === 'issued',
    canReissue: allowed && certificate.status === 'revoked',
  };
}

export type BackKey = 'student' | 'teacherOwn' | 'teacher' | 'school_admin' | 'platform_admin';

/** The holder goes back to their own list; staff to the list they came from. */
export function certificateBackLink(
  viewer: Pick<Session, 'uid' | 'role'>,
  certificate: Pick<Certificate, 'userUid'>,
): { href: string; key: BackKey } {
  switch (viewer.role) {
    case 'student':
      return { href: '/student/certificates', key: 'student' };
    case 'teacher':
      // A teacher's own Teacher Academy certificate is listed on their settings page.
      return certificate.userUid === viewer.uid
        ? { href: '/teacher/settings', key: 'teacherOwn' }
        : { href: '/teacher/reports', key: 'teacher' };
    case 'school_admin':
      return { href: '/school/certificates', key: 'school_admin' };
    case 'platform_admin':
      return { href: '/admin/certificates', key: 'platform_admin' };
  }
}

/** How an issue failure is shown; null = the generic `errorMessage(error)`. */
export type IssueProblem = 'invalid' | 'conflict' | 'forbidden' | 'notFound' | 'session' | null;

export function issueProblem(error: ActionError): IssueProblem {
  switch (error.code) {
    case 'validation':
      return 'invalid';
    case 'conflict':
      return 'conflict';
    case 'forbidden':
      return 'forbidden';
    case 'not_found':
      return 'notFound';
    case 'unauthenticated':
      return 'session';
    default:
      return null;
  }
}

/**
 * How a revoke failure is shown. 'field' = a validation failure whose only path is `reason`:
 * the message goes under the textarea, no Alert. null = an Alert with `errorMessage(error)`.
 */
export type RevokeProblem = 'field' | 'invalid' | 'forbidden' | 'notFound' | 'session' | null;

export function revokeProblem(error: ActionError): RevokeProblem {
  switch (error.code) {
    case 'validation': {
      const paths = Object.keys(error.fieldErrors ?? {});
      return paths.length > 0 && paths.every((path) => path === 'reason') ? 'field' : 'invalid';
    }
    case 'forbidden':
      return 'forbidden';
    case 'not_found':
      return 'notFound';
    case 'unauthenticated':
      return 'session';
    default:
      return null;
  }
}
