// After an action call threw instead of answering (3.1, Q14).
//
// Since WS-F-3, src/proxy.ts lets a signed-out server-action POST through and runAction answers
// `unauthenticated` itself, so this is a safety net: a call can still throw (a redirect from
// elsewhere, a network failure), and without a second look a throw reads as `internal`, telling
// the author to try again instead of logging in. Asking for this page again, without following
// redirects, tells the two apart: a redirect (the proxy still redirects a signed-out page
// request) means the session is gone; a page, or no network at all, means it was something else.

/** True when this page, asked again, now redirects (to the login page): the session ended. */
export async function sessionLost(url?: string): Promise<boolean> {
  try {
    const response = await fetch(url ?? window.location.href, {
      method: 'HEAD',
      redirect: 'manual',
      cache: 'no-store',
      credentials: 'same-origin',
    });
    return response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400);
  } catch {
    return false;
  }
}
