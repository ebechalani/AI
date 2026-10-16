# WS-D-3: `Referrer-Policy: no-referrer` on `/api/files`

- **From:** WS-D (Projects + review; build spec 16.3), 2026-10-15
- **Status:** closed. Landed by the foundation maintainer on 2026-10-15, as wanted (additive).
- **Frozen files concerned:** `next.config.ts`, `docs/ARCHITECTURE.md` (1.4, 6.9, 11.1)

## Problem

1.4 and 6.9 require `Referrer-Policy: no-referrer` on file responses, so the URL of a
learner's file (in production a short-lived signed Storage URL after a `302`) never travels in
a `Referer` header. `next.config.ts` sets `Referrer-Policy: strict-origin-when-cross-origin`
on `/(.*)`, and the route (or `storage-admin.serveFile`, which already sets `no-referrer`)
cannot override it. In Next 16.3.8:

- `server/lib/router-server.js` writes the config headers with `res.setHeader(key, value)`
  before the handler runs;
- `build/templates/app-route.js` passes a dynamic (non-ISR) GET response to
  `server/send-response.js`, which appends a response header only when the outgoing response
  does not have it yet (`typeof res.getHeader(name) !== 'undefined'` skips it).

So the global value wins over the handler's. `Cache-Control` is not affected, because no
config entry sets it.

## Change (landed)

`next.config.ts`, `headers()`: a second entry after the `/(.*)` catch-all,

```ts
{ source: '/api/files/:path*', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }] }
```

Next's `headers.md` ("Header Overriding Behavior"): when two entries set the same key, the
last one wins. `docs/ARCHITECTURE.md` 11.1 describes the entry, and 1.4 and 6.9 say where the
header comes from. `tests/unit/next-config-headers.test.ts` (new) pins the order: the
catch-all keeps `strict-origin-when-cross-origin`, the `/api/files/:path*` entry comes after it
with `no-referrer` only, and no later entry sets the policy again.

Evidence (`next dev` on port 3100, emulator mode; the route itself is WS-D's and did not exist
yet, so these are Next's own `404` answers, which carry the config headers all the same):

```
before: curl -sI http://localhost:3100/api/files/0f8fad5b-d9cb-469f-a165-70867728950e
        HTTP/1.1 404 Not Found
        Referrer-Policy: strict-origin-when-cross-origin
after:  the same request
        HTTP/1.1 404 Not Found
        Referrer-Policy: no-referrer           (one header, not two)
        /api/files                    → no-referrer
        /en                           → strict-origin-when-cross-origin
        /api/filesx                   → strict-origin-when-cross-origin
```

The dev server restarted itself on the config change ("Found a change in next.config.ts").
The WS-D builder records the header of the real route with `curl -sI` (spec 14 C6).
