# WS-F-3: the proxy redirects a signed-out server-action POST, so `unauthenticated` never arrives

- **From:** WS-F (Course creator; review fix round), 2026-10-23
- **Status:** closed. Landed by the foundation maintainer on 2026-10-23.
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

## Change (landed)

- `src/proxy.ts`: `ACTION_HEADER = 'next-action'`, Next's `ACTION_HEADER` from
  `next/dist/client/components/app-router-headers`, which the Next client sends with every
  server-action call (`fetchServerAction` in `server-action-reducer.js`: a `POST` to the page's
  own URL). A signed-out request that is a `POST` and carries that header is no longer
  redirected to the login page; it goes to the next-intl middleware like every other request. A
  `GET` with the header, a `POST` without it, any other method with it, and every signed-in or
  public request behave as before. The header's value is not judged, since Next itself refuses
  an unknown id.
- `tests/unit/proxy.test.ts` (new) sends Next's own `ACTION_HEADER`, so a renamed header fails
  it. A signed-out `POST` with the header is handed on. A signed-out `GET` with it, a `POST`
  without it, and `HEAD`, `PUT` and `DELETE` with it are redirected to
  `/en/login?next=%2Fteacher%2Fcreate%2Fc1` (query dropped, as before). Signed-in `GET`, `POST`
  and `POST` with the header are handed on, and so are public paths. Against the previous proxy,
  only the first case fails. next-intl's middleware is replaced by a stand-in (its build imports
  `next/server` without an extension, which Node's loader refuses outside Next).
- `docs/ARCHITECTURE.md` 1.3 (the exception and why the header's value is not judged), 1.4 (step
  2 also runs for a signed-out call), 1.6 (the `proxy.ts` row) and 10.1 (the `runAction`
  contract: a signed-out call answers `unauthenticated`).

How Next 16.3.8 answers a `POST` with that header was read in
`server/lib/server-action-request-meta.js`, `server/app-render/action-handler.js` and
`app-render.js`, then checked. Any `POST` with the header is a fetch action. An id that is not
in the server manifest (or an empty one) is answered before anything renders: `404`,
`text/plain`, `x-nextjs-action-not-found: 1`, body `Server action not found.`. An
`application/x-www-form-urlencoded` body gets `404` with the root not-found page. A request
that also carries `rsc: 1` is handled as a page-payload request before the action handler runs:
Next first redirects it (`307`) to the same URL with its `_rsc` parameter, then renders the
payload, in which `requireRole` throws the redirect to the login page.

The run's security review found two more render paths, recorded in 1.3. A recognized action
whose call changes a cookie (`signOutAction`, `createSessionAction`, or next-intl's
`NEXT_LOCALE` when the proxy sets it) has the page rendered into its answer
(`x-action-revalidated: 1`: signed out, `getClientAuthTokenAction` posted to `/en/admin/users`
answers `unauthenticated` plus the page tree with `NEXT_REDIRECT;replace;/en/login`, 189 KB;
with `Cookie: NEXT_LOCALE=en`, 113 bytes, the result alone). A crafted
`next-router-state-tree` renders only the page segment, without its layouts. Both end in the
page's own `requireRole` (1.3, step 3), and no answer holds seeded data. Neither is new: any
`__session` value, even junk, already passed the proxy.

Checked against the running dev server, signed out, with a bogus action id:

- `/en/teacher`, `/en/admin` and `/en/teacher/create/<id>`. Text, multipart or empty body, with
  or without `Origin`, with `Accept: text/html`, or an empty id: `404 text/plain`,
  `x-nextjs-action-not-found: 1`, `Server action not found.`. Urlencoded body: `404 text/html`,
  "Page not found" in the root layout, no navigation. Cross-site `Origin`: `500
  text/x-component`, "Invalid Server Actions request." (Next's CSRF check). With `rsc: 1`: `307`
  to `?_rsc=…`, then `200 text/x-component` with `NEXT_REDIRECT;replace;/en/login;307` and the
  public message catalog only.
- All 64 page paths of the six signed-in areas (seed and gate ids), each probed three ways
  (text, urlencoded, `rsc: 1` followed): no answer contains any seeded data (course, class,
  school and user names, emails, the gate's ids). A signed-out `GET` of each still answers `307`
  to the login page.

Checked in Chromium as teacher@demo, at 1366 and 375 px, on the details tab of "Gate course
mvkpodgy" (`/en/teacher/create/<courseId>?tab=details`): typed a summary, cleared the cookies,
pressed "Save details". The action `POST` answers `200 text/x-component` with
`{"ok":false,"error":{"code":"unauthenticated"}}` (no `307`). The form shows WS-F's
session-ended alert ("Your session has ended. Log in again to continue.", "Your changes are
still here…", "Log in again" in a new tab) and no `errors.internal`. The page is not reloaded,
the URL does not change and the typed summary stays in its field. The action `POST` is the only
request (the session probe is not reached), the course is not written, and the console shows no
error.

WS-F's workaround stays as a safety net: `src/components/course-editor/session-probe.ts` and its
call in `use-editor-action.ts` are now reached only when an action call throws for another
reason (no network, a fault outside `runAction`). The probe then finds a page or no network, and
the failure stays `internal`; a redirect would still read as a lost session. Their comments
(the header of `session-probe.ts`, and the `catch` in `use-editor-action.ts`) were updated by
the foundation maintainer when this request closed; WS-F may still remove the probe.
