import { ACTION_HEADER } from 'next/dist/client/components/app-router-headers';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import proxy from '@/proxy';

// The proxy's signed-out redirect (ARCHITECTURE.md 1.3). A server-action call is posted to the
// page's own path; redirected to the login page it throws in the Next client, so it is handed on
// and runAction answers `unauthenticated` (10.1; foundation request WS-F-3). Every other
// signed-out request to a signed-in area is still redirected. The test sends Next's own
// ACTION_HEADER, so a renamed header fails here.

// next-intl's middleware build imports `next/server` without an extension, which Node's ESM
// loader refuses outside Next. The stand-in returns one known response: "handed on" is that
// response, "redirected" is a 307 to the login page.
const i18n = vi.hoisted(() => {
  const routed = new Response(null, { status: 200 });
  return { routed, handle: vi.fn<(request: NextRequest) => Response>(() => routed) };
});
vi.mock('next-intl/middleware', () => ({ default: () => i18n.handle }));

const COURSE_PAGE = 'http://localhost:3100/en/teacher/create/c1?tab=details';
const LOGIN = 'http://localhost:3100/en/login?next=%2Fteacher%2Fcreate%2Fc1';
const ACTION_ID = '40e9d3a9ee6ed2f8f643acc50bbc789aaecc97be79';

function request(
  method: string,
  { action = false, signedIn = false }: { action?: boolean; signedIn?: boolean } = {},
  url = COURSE_PAGE,
) {
  const headers = new Headers();
  if (action) headers.set(ACTION_HEADER, ACTION_ID);
  if (signedIn) headers.set('cookie', '__session=session-cookie');
  return new NextRequest(url, { method, headers });
}

function expectRedirectToLogin(response: Response) {
  expect(response.status).toBe(307);
  expect(response.headers.get('location')).toBe(LOGIN);
  expect(i18n.handle).not.toHaveBeenCalled();
}

function expectHandedOn(response: Response, sent: NextRequest) {
  expect(response).toBe(i18n.routed);
  expect(i18n.handle).toHaveBeenCalledExactlyOnceWith(sent);
}

describe('proxy sign-in redirect', () => {
  beforeEach(() => i18n.handle.mockClear());

  it('hands a signed-out server-action call on to the locale middleware', () => {
    const sent = request('POST', { action: true });
    expectHandedOn(proxy(sent), sent);
  });

  it('redirects a signed-out page request to the login page, without its query', () => {
    expectRedirectToLogin(proxy(request('GET')));
  });

  it('still redirects a signed-out GET that carries the action header', () => {
    expectRedirectToLogin(proxy(request('GET', { action: true })));
  });

  it('still redirects a signed-out POST without the action header', () => {
    expectRedirectToLogin(proxy(request('POST')));
  });

  it.each(['HEAD', 'PUT', 'DELETE'])('still redirects a signed-out %s with the action header', (method) => {
    expectRedirectToLogin(proxy(request(method, { action: true })));
  });

  it.each([
    ['GET', false],
    ['POST', false],
    ['POST', true],
  ])('hands a signed-in %s on (action header: %s)', (method, action) => {
    const sent = request(method, { action, signedIn: true });
    expectHandedOn(proxy(sent), sent);
  });

  it('hands signed-out requests to public paths on, as before', () => {
    for (const sent of [
      request('GET', {}, 'http://localhost:3100/en/pathways'),
      request('POST', { action: true }, 'http://localhost:3100/fr/join'),
    ]) {
      i18n.handle.mockClear();
      expectHandedOn(proxy(sent), sent);
    }
  });
});
