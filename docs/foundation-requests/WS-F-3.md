# WS-F-3: the proxy redirects a signed-out server-action POST, so `unauthenticated` never arrives

- **From:** WS-F (Course creator; review fix round), 2026-10-23
- **Status:** open.
- **Frozen files concerned:** `src/proxy.ts`, `tests/unit/proxy-matcher.test.ts` (or a new
  `tests/unit/proxy.test.ts`), `docs/ARCHITECTURE.md` (1.3, 1.6, 10.1)

## Problem

10.1 says an action called without a session answers `{ ok: false, error: { code:
'unauthenticated' } }` (`runAction`, step 2), and every area that keeps drafts relies on it:
WS-D's project form and WS-F's editor show "Your session ended" with a "Log in again" link that
opens in a new tab, and never refresh, so nothing typed is lost (WS-F SPEC Q14, WS-D's
pattern).

That answer never arrives in the two common cases: the 24 h staff cookie expired (the browser
drops it), or the user signed out in another tab. The session cookie is then absent, and
`src/proxy.ts` matches the page path of the action POST (`/en/teacher/create/...`) with
`SIGNED_IN_PATH` and answers `307 → /en/login?next=...` before Next's action handler runs. The
Next client (`server-action-reducer.js`) follows the redirect, receives the login page's HTML or
a "Server Action not found" answer, and throws. Callers can only map a throw to `internal`
("Something went wrong on our side"), so the author is told to try again instead of to log in.

Probe (WS-F UX review): log in as a teacher, open a course's details, clear the cookies, press
"Save details": the POST answers `307 → /en/login`, the page shows `errors.internal`.

## Change wanted

In `src/proxy.ts`, do not redirect a request that carries the `Next-Action` header (Next's
`ACTION_HEADER`, sent with every server-action POST); hand it to the next-intl middleware as
now. `runAction` then reads no session and answers `unauthenticated`, as 10.1 describes. The
cookie gate is UX only (1.6: "Redirects when no cookie | None (UX only)"), and an action never
renders a page, so nothing is weakened: `runAction`'s own session and role checks stay the
authority.

```ts
const signedInPath = SIGNED_IN_PATH.exec(request.nextUrl.pathname);
const serverAction = request.headers.has('next-action');
if (signedInPath && !serverAction && !request.cookies.has(SESSION_COOKIE)) { ... }
```

Docs: 1.3 and the 1.6 row ("Redirects page requests when no cookie; a server-action POST goes
through, so `runAction` answers `unauthenticated`"). Test: a signed-out request with the
`next-action` header is not redirected; one without it still is.

## Workaround in WS-F until then

`src/components/course-editor/use-editor-action.ts` asks `session-probe.ts` after an action call
throws: the same page is requested again with `HEAD` and `redirect: 'manual'`; a redirect means
the session is gone, and the editor shows its session-ended alert (login in a new tab, no
refresh). Any other answer, or no network, still reads as `internal` (with the offline hint).
Once this request lands, the action answers `unauthenticated` itself and the probe is no longer
reached in that case; it can stay as a safety net or be removed by WS-F.
