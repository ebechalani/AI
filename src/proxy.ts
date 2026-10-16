import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { LOCALES } from '@/lib/i18n/config';
import { routing } from '@/lib/i18n/routing';

const handleI18nRouting = createMiddleware(routing);

// Must equal SESSION_COOKIE_NAME in src/lib/auth/session.ts, which is server-only and cannot
// be imported here.
const SESSION_COOKIE = '__session';

const SIGNED_IN_PATH = new RegExp(
  `^/(${LOCALES.join('|')})(/(?:student|teacher|school|admin|certificates|preview)(?:/.*)?)$`,
);

// The cookie's presence is all this checks: it saves a signed-out visitor a round trip through
// a page that would redirect anyway. Authorization happens in requireRole() and below.
export default function proxy(request: NextRequest) {
  const signedInPath = SIGNED_IN_PATH.exec(request.nextUrl.pathname);
  if (signedInPath && !request.cookies.has(SESSION_COOKIE)) {
    const [, locale, path] = signedInPath;
    const login = request.nextUrl.clone();
    login.pathname = `/${locale}/login`;
    login.search = '';
    login.searchParams.set('next', path);
    return NextResponse.redirect(login);
  }
  return handleI18nRouting(request);
}

// Next reads the matcher statically, so the locales are spelled out here; a unit test keeps
// them equal to LOCALES (tests/unit/proxy-matcher.test.ts).
export const config = {
  matcher: [
    // Route handlers, Next internals and files with an extension (public/) are never
    // locale-routed.
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // A locale-prefixed path always is, even with a dot in it (/fr/teacher/classes/bad.id):
    // without the proxy its layouts and not-found boundary render in the default locale
    // (foundation request WS-C-2). public/ has no en/ or fr/ folder, so no static file is
    // caught by this.
    '/(en|fr)/:path*',
  ],
};
