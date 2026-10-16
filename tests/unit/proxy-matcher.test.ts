import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import type { ProxyMatcher } from 'next/dist/build/analysis/get-page-static-info';
import { describe, expect, it, vi } from 'vitest';
import { config } from '@/proxy';
import { LOCALES } from '@/lib/i18n/config';

// Only `config` is under test. next-intl's middleware build imports `next/server` without an
// extension, which Node's ESM loader refuses outside Next.
vi.mock('next-intl/middleware', () => ({ default: () => () => undefined }));

// The proxy runs the next-intl middleware (locale header, locale redirect) and the signed-out
// redirect. It must run for every page path, a dotted one included (foundation request WS-C-2:
// /fr/teacher/classes/bad.id rendered its shell and not-found page in English), and never for
// route handlers, Next internals or the files of public/.

// Next's own compiler of `config.matcher` (what the build and `next dev` run) and the matcher it
// applies per request, so the test checks what Next does with the patterns, not a copy of them.
// The compiler is exported at runtime but missing from Next's type declarations.
const nextRequire = createRequire(import.meta.url);
const { getMiddlewareMatchers } = nextRequire(
  'next/dist/build/analysis/get-page-static-info',
) as { getMiddlewareMatchers: (matcher: string[], nextConfig: object) => ProxyMatcher[] };
const { getMiddlewareRouteMatcher } = nextRequire(
  'next/dist/shared/lib/router/utils/middleware-route-matcher',
) as typeof import('next/dist/shared/lib/router/utils/middleware-route-matcher');

const runsProxy = getMiddlewareRouteMatcher(getMiddlewareMatchers(config.matcher, {}));
const runs = (pathname: string) => runsProxy(pathname, {} as never, {});

describe('proxy matcher', () => {
  it.each([
    '/',
    '/en',
    '/fr',
    '/fr/',
    '/fr/pathways',
    '/en/verify/RH-ABCDEFGHJK',
    '/fr/student/learn/my-first-ai-adventure',
    '/teacher',
  ])('runs for the page path %s', (pathname) => {
    expect(runs(pathname)).toBe(true);
  });

  it.each([
    '/fr/teacher/assessments/bad.id',
    '/fr/teacher/classes/bad.id',
    '/en/student/challenges/x.y',
    '/fr/a.b/c.d',
    '/fr/certificates/a.b',
  ])('runs for the locale-prefixed path with a dot %s', (pathname) => {
    expect(runs(pathname)).toBe(true);
  });

  it.each([
    '/favicon.ico',
    '/icon.svg',
    '/robots.txt',
    '/api/files/abc',
    '/api/ai/tutor',
    '/_next/static/chunks/main.js',
    '/_next/image',
    '/_vercel/insights/script.js',
  ])('skips %s', (pathname) => {
    expect(runs(pathname)).toBe(false);
  });

  it('skips every file of public/; public/ has no locale folder for the locale pattern to catch', () => {
    const publicDir = fileURLToPath(new URL('../../public', import.meta.url));
    const entries = existsSync(publicDir) ? readdirSync(publicDir) : [];
    for (const locale of LOCALES) expect(entries).not.toContain(locale);
    for (const entry of entries.filter((name) => name.includes('.'))) {
      expect(runs(`/${entry}`)).toBe(false);
    }
  });

  it('names exactly the configured locales (Next reads the matcher statically)', () => {
    const localePattern = config.matcher.find((source) => source.endsWith('/:path*'));
    expect(localePattern).toBe(`/(${LOCALES.join('|')})/:path*`);
  });
});
