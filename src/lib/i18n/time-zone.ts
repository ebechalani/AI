// The viewer's time zone (ARCHITECTURE.md 12: dates are stored in UTC and displayed in the
// browser's time zone). `TimeZoneCookie` (src/components/layout) records the browser's zone in
// the `tz` cookie, and the request config (request.ts) hands it to next-intl, which passes the
// same zone to server and client components, so a date prints alike on both (no hydration
// mismatch). Shared and pure: imported on the server and in the browser.

export const TIME_ZONE_COOKIE = 'tz';

/** The zone of a viewer whose browser has not reported one, or reported one the server lacks. */
export const DEFAULT_TIME_ZONE = 'UTC';

/** About one year, in seconds. */
export const TIME_ZONE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

// IANA names only ("Asia/Beirut", "America/Argentina/Buenos_Aires", "America/Port-au-Prince",
// "Etc/GMT+3", "UTC"). This leaves out the offset form ("+03:00"), which recent runtimes accept
// but older browsers refuse, and anything a cookie value cannot hold as it is.
const TIME_ZONE_NAME = /^[A-Za-z][A-Za-z0-9_+-]*(?:\/[A-Za-z0-9_+-]+){0,2}$/;
const TIME_ZONE_MAX_LENGTH = 64;

/**
 * `value` as the runtime's Intl names it (case and aliases resolved) when it is an IANA zone
 * name that this runtime's Intl supports; otherwise null.
 */
export function toSupportedTimeZone(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  if (value.length > TIME_ZONE_MAX_LENGTH || !TIME_ZONE_NAME.test(value)) return null;
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: value }).resolvedOptions().timeZone;
  } catch {
    // RangeError: a zone this runtime does not know.
    return null;
  }
}

/** The zone to format with for a request: the cookie's zone when supported, else UTC. */
export function resolveTimeZone(cookieValue: string | null | undefined): string {
  return toSupportedTimeZone(cookieValue) ?? DEFAULT_TIME_ZONE;
}

/** The value of the `tz` cookie in a `document.cookie` string, or null. */
export function readTimeZoneCookie(cookieHeader: string): string | null {
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === TIME_ZONE_COOKIE) {
      return part.slice(separator + 1).trim();
    }
  }
  return null;
}

/**
 * The `document.cookie` assignment that records `timeZone` for every path of the site. The
 * value needs no encoding: `toSupportedTimeZone` lets only cookie-safe characters through.
 */
export function timeZoneCookie(timeZone: string, secure: boolean): string {
  return [
    `${TIME_ZONE_COOKIE}=${timeZone}`,
    'Path=/',
    `Max-Age=${TIME_ZONE_COOKIE_MAX_AGE}`,
    'SameSite=Lax',
    ...(secure ? ['Secure'] : []),
  ].join('; ');
}
