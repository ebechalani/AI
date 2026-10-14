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

export const config = {
  // Route handlers, Next internals and files with an extension are never locale-routed.
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
