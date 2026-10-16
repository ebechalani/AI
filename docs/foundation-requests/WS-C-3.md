# WS-C-3: dates and times are shown in the server's time zone

- **From:** WS-C (Quizzes + assessments; build spec 11.1), 2026-10-16
- **Status:** closed. Landed by the foundation maintainer on 2026-10-16 as wanted: a `tz` cookie
  written by a client component, read and validated by the request config, UTC as the fallback.
- **Frozen files concerned:** `src/lib/i18n/request.ts`; a small client component in
  `src/components/layout` (or the root `[locale]/layout.tsx`) to set a cookie

## Problem

`getRequestConfig` in `src/lib/i18n/request.ts` returns `{ locale, messages }` without a
`timeZone`. next-intl then uses the server's zone (`Intl.DateTimeFormat().resolvedOptions()`,
UTC on Vercel and in this container), and `NextIntlClientProvider` passes that zone to the
client. `useDateFormat()` (`src/components/domain/format.ts`) reads it with `useTimeZone()`. Server
and client therefore agree, and there is no hydration error, but every time of day is shown in
UTC with no zone label.

A teacher or learner in Beirut (UTC+3) who makes an attempt at 13:48 local time sees "10:48 AM"
in:

- the quiz intro's last-attempt line (`src/components/quiz/LatestAttempt.tsx`),
- the assessments table's "Submitted" column (`assessments/_components/AttemptsTable.tsx`),
- the attempt page's "At {time}" hint (`assessments/[attemptId]/_components/AttemptOverview.tsx`),

and in every other `dateTime` or `time` from `useDateFormat()` in other workstreams. A date can
also be off by one day near midnight.

## Reproduce

Playwright context with `timezoneId: 'Asia/Beirut'` (the browser reports `Asia/Beirut`):

- teacher@demo, attempt `demo-omar_…_quiz-m1_1` (`submittedAt` `2026-10-16T10:48:19Z`):
  "Submitted | Oct 16, 2026 | At 10:48 AM, answered in French". The local time is 13:48.
- lea.demo, `m1-l2` (read only): "Attempt 1 · 100% · Oct 16, 2026, 10:48 AM".

## Why WS-C cannot fix it in its own files

Formatting in the browser's zone only on the client would make the server and client renders
disagree (a hydration mismatch), and a server component has no way to know the viewer's zone.
The zone has to reach the request config.

## Wanted change

1. A small client component in the root layout sets a cookie such as `tz` from
   `Intl.DateTimeFormat().resolvedOptions().timeZone`, when it is missing or different
   (`path=/`, `SameSite=Lax`, about one year). A later setting (a user's or a school's zone)
   can replace it.
2. `getRequestConfig` reads the cookie, checks it is a zone the runtime knows (for example
   `try { new Intl.DateTimeFormat('en', { timeZone }) } catch { … }`), and returns
   `{ locale, messages, timeZone }`, with `'UTC'` as the fallback. Reading `cookies()` makes the
   signed-in pages dynamic, which they already are (`requireRole` reads the session cookie).
   The public pages that render dates statically (if any) keep the fallback.

The first page view before the cookie exists still shows UTC. If that matters, the cookie can be
set at sign-in instead (the sign-in form runs in the browser).

## Check after the change

With `timezoneId: 'Asia/Beirut'`, the three places above show 1:48 PM for the seeded attempt,
with no hydration warning, and an `en`/`fr` switch keeps the zone.

## Change (landed)

Landed by the foundation maintainer on 2026-10-16.

- `src/lib/i18n/time-zone.ts` (new, shared and pure): `TIME_ZONE_COOKIE` (`'tz'`),
  `DEFAULT_TIME_ZONE` (`'UTC'`), `toSupportedTimeZone(value)` (an IANA name only, at most 64
  characters, no offset form such as `+03:00` that older browsers refuse, and one that the runtime's
  Intl accepts: `new Intl.DateTimeFormat('en-US', { timeZone })`; returns the runtime's own
  spelling), `resolveTimeZone(cookieValue)`, `readTimeZoneCookie(document.cookie)` and
  `timeZoneCookie(zone, secure)` (`tz=<zone>; Path=/; Max-Age=31536000; SameSite=Lax`, plus
  `Secure` on https).
- `src/components/layout/TimeZoneCookie.tsx` (new, client, renders nothing; exported from the
  layout index) and `src/app/[locale]/layout.tsx` (mounted inside `NextIntlClientProvider`): writes
  the browser's zone when the cookie is missing or different; when it wrote the cookie and the page
  on screen was rendered in another zone it calls `router.refresh()` once, so even the first visit
  ends in the viewer's zone. It does nothing when the cookie already holds the zone (no loop when
  the server does not know the browser's zone), nor when the browser blocks cookies.
- `src/lib/i18n/request.ts`: returns `{ locale, messages, timeZone }`; the zone comes from the
  cookie through `resolveTimeZone`; outside a request (no cookie store) it is UTC, and Next's own
  errors are rethrown (`unstable_rethrow`). `NextIntlClientProvider` inherits the zone, so server and
  client components format alike and nothing mismatches on hydration.
- Reading the cookie renders every page dynamically. The public pages already were (the public
  layout reads the session); the auth pages (login, sign-up...) were the only static ones and show
  no dates.
- `tests/unit/i18n-time-zone.test.ts` (new): the helpers, and the request config with a valid, an
  unknown and a missing cookie, outside a request, and with a Next bail-out error passed through.
- `docs/ARCHITECTURE.md`: 2 (the two new files), 7.4 (`useDateFormat` follows the viewer's zone),
  7.5 (`TimeZoneCookie`), 12 ("Time zones").

Checked in Chromium with `timezoneId: 'Asia/Beirut'`: the first, signed-out visit of `/en` sets
`tz=Asia/Beirut` (path `/`, SameSite Lax, one year). As teacher@demo, Omar's seeded attempts
(`submittedAt` 15:34 UTC in the current seed) show "Oct 16, 2026, 6:34 PM" in the assessments table,
"16 oct. 2026, 18:34" on `/fr/teacher/assessments` (the language switch keeps the zone), and "At 6:34
PM, answered in French" on the attempt page; no hydration warning and no console error.
