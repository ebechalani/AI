import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_TIME_ZONE,
  readTimeZoneCookie,
  resolveTimeZone,
  TIME_ZONE_COOKIE,
  TIME_ZONE_COOKIE_MAX_AGE,
  timeZoneCookie,
  toSupportedTimeZone,
} from '@/lib/i18n/time-zone';

// Dates are displayed in the viewer's time zone (ARCHITECTURE.md 12; foundation request WS-C-3):
// the browser records its zone in the `tz` cookie and the request config hands it to next-intl.

const cookieStore = vi.hoisted(() => ({
  value: undefined as string | undefined,
  error: null as unknown,
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => {
    if (cookieStore.error !== null) return Promise.reject(cookieStore.error);
    return Promise.resolve({
      get: (name: string) =>
        name === TIME_ZONE_COOKIE && cookieStore.value !== undefined
          ? { name, value: cookieStore.value }
          : undefined,
    });
  }),
}));

// getRequestConfig wraps the callback for Next; the test calls the callback itself.
vi.mock('next-intl/server', () => ({ getRequestConfig: (callback: unknown) => callback }));
// Vite resolves the catalogs' variable import against the files that exist when it transforms
// request.ts, and some namespaces are written later by their workstreams: one namespace is enough
// here.
vi.mock('@/lib/i18n/namespaces', () => ({ NAMESPACES: ['common'] }));

type RequestConfigCallback = (params: {
  requestLocale: Promise<string | undefined>;
}) => Promise<{ locale: string; messages: Record<string, unknown>; timeZone: string }>;

async function requestConfig(locale: string) {
  const { default: callback } = (await import('@/lib/i18n/request')) as unknown as {
    default: RequestConfigCallback;
  };
  return callback({ requestLocale: Promise.resolve(locale) });
}

// The wall-clock time of a fixed instant in `zone`, to compare two spellings of one zone.
function wallClock(zone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date('2026-10-16T10:48:19Z'));
}

describe('toSupportedTimeZone', () => {
  it.each(['Asia/Beirut', 'Europe/Paris', 'America/Port-au-Prince', 'Etc/GMT+3', 'UTC'])(
    'accepts the IANA zone %s',
    (zone) => {
      expect(toSupportedTimeZone(zone)).toBe(zone);
    },
  );

  it('returns the runtime’s own spelling of a zone (case, aliases)', () => {
    expect(toSupportedTimeZone('asia/beirut')).toBe('Asia/Beirut');
    // ICU names this zone by its older alias, America/Buenos_Aires: the same clock.
    const deep = toSupportedTimeZone('America/Argentina/Buenos_Aires');
    expect(deep).not.toBeNull();
    expect(wallClock(deep!)).toBe(wallClock('America/Argentina/Buenos_Aires'));
  });

  it.each([
    ['an unknown zone', 'Mars/Olympus_Mons'],
    ['an offset, which older browsers refuse', '+03:00'],
    ['a value with a separator', 'Asia/Beirut; Path=/'],
    ['a value with a space', 'Asia/ Beirut'],
    ['an encoded value', 'Asia%2FBeirut'],
    ['a path walk', '../etc'],
    ['an empty value', ''],
    ['a value that is too long', `A${'b'.repeat(64)}`],
  ])('refuses %s', (_label, value) => {
    expect(toSupportedTimeZone(value)).toBeNull();
  });

  it('refuses a missing value', () => {
    expect(toSupportedTimeZone(undefined)).toBeNull();
    expect(toSupportedTimeZone(null)).toBeNull();
  });
});

describe('resolveTimeZone', () => {
  it('uses the cookie’s zone when the runtime supports it', () => {
    expect(resolveTimeZone('Asia/Beirut')).toBe('Asia/Beirut');
  });

  it('falls back to UTC for a missing or unsupported cookie', () => {
    expect(DEFAULT_TIME_ZONE).toBe('UTC');
    expect(resolveTimeZone(undefined)).toBe('UTC');
    expect(resolveTimeZone('Not/A_Zone')).toBe('UTC');
    expect(resolveTimeZone('+03:00')).toBe('UTC');
  });
});

describe('the tz cookie', () => {
  it('records the zone for the whole site for about a year', () => {
    expect(TIME_ZONE_COOKIE_MAX_AGE).toBe(31_536_000);
    expect(timeZoneCookie('Asia/Beirut', false)).toBe(
      'tz=Asia/Beirut; Path=/; Max-Age=31536000; SameSite=Lax',
    );
    expect(timeZoneCookie('Asia/Beirut', true)).toBe(
      'tz=Asia/Beirut; Path=/; Max-Age=31536000; SameSite=Lax; Secure',
    );
  });

  it('reads the zone back from document.cookie', () => {
    expect(readTimeZoneCookie('')).toBeNull();
    expect(readTimeZoneCookie('NEXT_LOCALE=fr')).toBeNull();
    expect(readTimeZoneCookie('tz=Asia/Beirut')).toBe('Asia/Beirut');
    expect(readTimeZoneCookie('NEXT_LOCALE=fr; tz=Europe/Paris; other=1')).toBe('Europe/Paris');
    expect(readTimeZoneCookie('xtz=Europe/Paris; tzx=1')).toBeNull();
  });
});

describe('request config', () => {
  beforeEach(() => {
    cookieStore.value = undefined;
    cookieStore.error = null;
  });

  it('returns the viewer’s time zone with the locale and the messages', async () => {
    cookieStore.value = 'Asia/Beirut';
    const config = await requestConfig('fr');
    expect(config.locale).toBe('fr');
    expect(config.timeZone).toBe('Asia/Beirut');
    expect(config.messages).toHaveProperty('common');
  });

  it('uses UTC without a cookie, or with one the runtime does not know', async () => {
    expect((await requestConfig('en')).timeZone).toBe('UTC');
    cookieStore.value = 'Mars/Olympus_Mons';
    expect((await requestConfig('en')).timeZone).toBe('UTC');
  });

  it('uses UTC outside a request, where there is no cookie store', async () => {
    cookieStore.error = new Error('`cookies` was called outside a request scope.');
    expect((await requestConfig('en')).timeZone).toBe('UTC');
  });

  it('lets Next’s own signals through (a static render bailing out)', async () => {
    const bailout = Object.assign(new Error('Dynamic server usage'), {
      digest: 'DYNAMIC_SERVER_USAGE',
    });
    cookieStore.error = bailout;
    await expect(requestConfig('en')).rejects.toBe(bailout);
  });
});
