// After an action call threw instead of answering (3.1, Q14).
//
// A server-action POST without the session cookie never reaches runAction: src/proxy.ts answers
// it with a redirect to the login page, the Next client follows it, cannot read the answer, and
// the call throws. Without a second look that reads as `internal`, and the author is told to try
// again instead of logging in. Asking for this page again, without following redirects, tells
// the two apart: a redirect means the session is gone; a page, or no network at all, means the
// failure was something else. Foundation request WS-F-3 asks the proxy to let such POSTs
// through, so runAction answers `unauthenticated` itself; this check then simply finds a page.

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
