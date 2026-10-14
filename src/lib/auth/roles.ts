import { ROLES, type Role } from '@/types/common';

export { ROLES };

/** Everyone but students: 24-hour sessions, revocation-checked mutations, the larger quotas. */
export const STAFF_ROLES: readonly Role[] = ['teacher', 'school_admin', 'platform_admin'];

export function isStaffRole(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

const ROLE_HOME: Record<Role, string> = {
  student: '/student',
  teacher: '/teacher',
  school_admin: '/school',
  platform_admin: '/admin',
};

/** The locale-less root of the role's own area. */
export function roleHome(role: Role): string {
  return ROLE_HOME[role];
}

// Areas every signed-in role may be sent back to (ARCHITECTURE.md 6.3).
const SHARED_AREAS = ['/certificates', '/preview'];

// The characters of the app's own routes and ids. Leaving out ':', '\', '?', '#', '%' and
// every control character rules out schemes, backslash tricks and anything percent-encoded.
const PLAIN_PATH = /^\/[A-Za-z0-9/._~-]*$/;

/**
 * Where to send a user after login. `next` comes from the query string, so it is accepted
 * only as a plain locale-less path inside the role's own area or a shared area; everything
 * else, including a path with a query or a fragment, becomes the role's home. This is what
 * keeps the login page from being an open redirect.
 */
export function safeNextPath(next: string | null | undefined, role: Role): string {
  const home = roleHome(role);
  if (typeof next !== 'string' || !PLAIN_PATH.test(next)) return home;
  const segments = next.split('/').slice(1);
  // An empty segment is a '//' (or a trailing slash); a dot segment would climb out of the area.
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    return home;
  }
  if (next === home || next.startsWith(`${home}/`)) return next;
  // A shared area has no index page: only what lies below it is a destination.
  return SHARED_AREAS.some((area) => next.startsWith(`${area}/`)) ? next : home;
}
