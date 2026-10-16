# WS-C-2: a path with a dot renders a French page in English

- **From:** WS-C (Quizzes + assessments; build spec 11.1), 2026-10-16
- **Status:** open
- **Frozen files concerned:** `src/proxy.ts` (option a), or the area layouts
  `src/app/[locale]/{student,teacher,school,admin}/**/layout.tsx` (option b)

## Problem

The proxy's matcher skips every path with a dot in it:

```ts
matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
```

So for `/fr/teacher/assessments/bad.id` the next-intl middleware never runs and sets no
locale header. `[locale]/layout.tsx` calls `setRequestLocale(locale)`, but Next renders
layouts, pages and the not-found boundaries of each segment in parallel, so the teacher shell
layout and `teacher/(shell)/not-found.tsx` resolve their messages before that call and fall
back to `en`. The result is an English page under `<html lang="fr">`: the shell's navigation,
the skip link, the not-found body and (before this round's WS-C fix) the document title.

Spec 9.C.5 lists `bad.id` as a not-found case for `/teacher/assessments/[attemptId]`. WS-E's
`/fr/teacher/classes/bad.id` shows the same problem, and so does any dotted id under any
signed-in area. A signed-out visitor also skips the proxy's sign-in redirect on such a path, but
`requireRole` still redirects them, so this is only about the language.

## Reproduce (teacher@demo, Chromium)

| URL | `<html lang>` | Title | Body |
| --- | --- | --- | --- |
| `/fr/teacher/assessments/does-not-exist` | fr | Tentative de quiz | Page introuvable |
| `/fr/teacher/assessments/bad.id` | fr | Quiz attempt (fixed by WS-C: now Tentative de quiz) | Page not found |
| `/fr/teacher/assessments/x.y` | fr | same | Page not found |
| `/fr/teacher/classes/bad.id` | fr | — | Page not found |

`next-dev.log` shows no `proxy.ts` timing for the dotted requests.

## What WS-C did meanwhile

Both assessments pages read `locale` from `params` and call `setRequestLocale(locale)`, and
their `generateMetadata` passes the locale to `getTranslations` explicitly. The document title
now follows the URL. The body cannot be fixed from WS-C's files: a dotted attempt id never
matches `COMPOSITE_ID_PATTERN`, so the page always calls `notFound()`, and the shell's
not-found boundary, rendered in parallel, does not see the page's `setRequestLocale`.

## Wanted change

Either of these. Option (a) is the smallest change and fixes every area at once.

**(a) Narrow the matcher to real static files**, so the proxy runs for every page path:

```ts
export const config = {
  // Route handlers, Next internals and static files are never locale-routed.
  matcher:
    '/((?!api|_next|_vercel|.*\\.(?:ico|png|jpe?g|svg|webp|gif|avif|txt|xml|webmanifest|js|css|map|woff2?)$).*)',
};
```

`public/` holds only `favicon.ico` and `icon.svg` today, and there are no metadata routes such
as `robots.ts`. Check that `/favicon.ico` and `/icon.svg` still load without a locale redirect.

**(b) Call `setRequestLocale(locale)` in every area layout** (`teacher/(shell)/layout.tsx`, the
student, school and admin shells, and the player layouts). This fixes the shell's navigation.
It may not fix the not-found boundaries, which render in parallel with the layouts.

A longer-term option: `next/root-params` (which next-intl 4.14 recommends over
`setRequestLocale`) needs `[locale]` to be the root layout, but `src/app/layout.tsx` is the root
layout today.

## Check after the change

`/fr/teacher/assessments/bad.id` and `/fr/teacher/classes/bad.id` show "Page introuvable", the
French shell navigation and the French title. `/en/...` stays English. `/favicon.ico` returns
200.
