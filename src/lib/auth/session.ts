import 'server-only';
import { cache } from 'react';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { getLocale } from 'next-intl/server';
import { loadProfileForSession } from '@/lib/data/users';
import { UnauthenticatedError } from '@/lib/errors';
import { getAdminAuth } from '@/lib/firebase/admin';
import { redirect } from '@/lib/i18n/navigation';
import type { Role } from '@/types/common';
import type { Session } from '@/types/user';
import { roleHome } from './roles';

/** src/proxy.ts checks for this cookie under the same name; it cannot import this module. */
export const SESSION_COOKIE_NAME = '__session';

const HOUR_MS = 60 * 60 * 1000;

/**
 * Students work on shared classroom computers: their cookie has no Max-Age, so it goes when
 * the browser closes, and the Firebase session cookie inside it ends after 12 hours whatever
 * the browser does. Staff stay signed in for 24 hours.
 */
export const SESSION_LIFETIME: {
  student: { expiresInMs: number; persistent: false };
  staff: { expiresInMs: number; persistent: true };
} = {
  student: { expiresInMs: 12 * HOUR_MS, persistent: false },
  staff: { expiresInMs: 24 * HOUR_MS, persistent: true },
};

async function readSessionCookie(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE_NAME)?.value || null;
}

// What verifySessionCookie answers for a cookie that is malformed, forged, expired or revoked,
// or whose account is disabled or deleted. Any other failure (missing credentials, the
// emulator guard, Firebase unreachable during a revocation check) is a server fault, not a
// signed-out visitor, and is thrown.
const REFUSED_COOKIE_CODES = new Set([
  'auth/argument-error',
  'auth/session-cookie-expired',
  'auth/session-cookie-revoked',
  'auth/user-disabled',
  'auth/user-not-found',
]);

function isRefusedCookie(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    REFUSED_COOKIE_CODES.has(error.code)
  );
}

// Signature and expiry are checked locally; with `checkRevoked` Firebase is asked as well.
async function verifyCookie(cookie: string, checkRevoked = false): Promise<DecodedIdToken | null> {
  const auth = getAdminAuth();
  try {
    return await auth.verifySessionCookie(cookie, checkRevoked);
  } catch (error) {
    if (isRefusedCookie(error)) return null;
    throw error;
  }
}

/**
 * The signed-in user of this request, or null. Role, school, classes and status come from the
 * profile document, never from the claims inside the cookie, so a disabled account or a
 * changed role takes effect on the next request. Never redirects.
 *
 * Deduplicated per render with React cache(); in a server action or a route handler every
 * call verifies and reads again.
 */
export const getSession: () => Promise<Session | null> = cache(async () => {
  const cookie = await readSessionCookie();
  if (cookie === null) return null;
  const decoded = await verifyCookie(cookie);
  if (decoded === null) return null;

  const profile = await loadProfileForSession(decoded.uid);
  if (profile === null || profile.status !== 'active') return null;
  // Sign-out, a password reset, a role change and a disable all move sessionsValidAfter
  // forward, which ends every cookie issued from an earlier sign-in.
  if (
    profile.sessionsValidAfter !== null &&
    decoded.auth_time * 1000 < Date.parse(profile.sessionsValidAfter)
  ) {
    return null;
  }

  return {
    uid: profile.id,
    role: profile.role,
    schoolId: profile.schoolId,
    classIds: profile.classIds,
    displayName: profile.displayName,
    locale: profile.locale,
    ageBand: profile.ageBand,
    avatarId: profile.avatarId,
    verifiedEducator: profile.verifiedEducator,
  };
});

/**
 * Asks Firebase whether the cookie's refresh tokens were revoked or the account disabled
 * there (a password reset through Firebase's own email flow does the former). One network
 * call, so it is made only where runAction asks for it: on staff mutations.
 */
export async function assertSessionNotRevoked(): Promise<void> {
  const cookie = await readSessionCookie();
  if (cookie === null || (await verifyCookie(cookie, true)) === null) {
    throw new UnauthenticatedError('The session cookie is missing, revoked or expired.');
  }
}

/** Pages and layouts only: sends a visitor without a session to the login page. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (session === null) return redirect({ href: '/login', locale: await getLocale() });
  return session;
}

/**
 * Pages and layouts only, as the first statement of every page of a role area: sends a
 * visitor without a session to the login page and a signed-in user of another role to their
 * own home.
 */
export async function requireRole(...roles: Role[]): Promise<Session> {
  const session = await requireSession();
  if (!roles.includes(session.role)) {
    return redirect({ href: roleHome(session.role), locale: await getLocale() });
  }
  return session;
}

/**
 * Exchanges a fresh ID token for a Firebase session cookie and sets it. Server actions and
 * route handlers only (a render cannot set cookies). The caller, establishSession, has
 * verified the token and the profile.
 */
export async function setSessionCookie(idToken: string, role: Role): Promise<void> {
  const lifetime = role === 'student' ? SESSION_LIFETIME.student : SESSION_LIFETIME.staff;
  const cookie = await getAdminAuth().createSessionCookie(idToken, {
    expiresIn: lifetime.expiresInMs,
  });
  (await cookies()).set(SESSION_COOKIE_NAME, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(lifetime.persistent ? { maxAge: lifetime.expiresInMs / 1000 } : {}),
  });
}

/** Server actions and route handlers only. */
export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}
