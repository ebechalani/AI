# WS-G-2: `ErrorState` has no `titleAs`, so an `error.tsx` page has no heading

- **From:** WS-G (School admin; review fix round), 2026-10-23
- **Status:** closed. Landed by the foundation maintainer on 2026-10-23.
- **Frozen files concerned:** `src/components/ui/ErrorState.tsx`, `docs/ARCHITECTURE.md` (7.3),
  `tests/unit/foundation-kit.test.ts`

## Problem

When a school page throws, `src/app/[locale]/school/error.tsx` replaces the page, and with it
the `PageHeader` that held the page's `<h1>`. What is left is `ErrorState`, which renders its
title in a `<p>` (`ErrorState.tsx`: `<p className="mt-4 text-base font-semibold text-ink">`)
and has no prop to change that. So the error page has no heading at all: a screen-reader user
who jumps by headings finds nothing, and the page's outline is empty.

`EmptyState` solved the same problem with `titleAs?: 'p' | 'h1' | 'h2' | 'h3'` (a not-found page
passes `h1`); `ErrorState` has no equivalent. All ten `error.tsx` files of `src/app/[locale]`
(the locale root, `(auth)`, `(public)`, `(shared)`, `admin`, `school`, and the `(shell)` and
`(player)` groups of `student` and `teacher`) render `ErrorState` and are in the same situation;
WS-G reports it for `/school` and changes only its own file.

## Failing case (checked in Chromium)

A school admin whose school document is missing: `/en/school` and `/fr/school` render the
school `error.tsx`; `document.querySelector('main h1')` is `null`, and the page has no `h1`–`h6`
(found by the WS-G UX review, `error-state.mjs`).

## Wanted change

- `src/components/ui/ErrorState.tsx`: a `titleAs?: 'p' | 'h1' | 'h2' | 'h3'` prop, default `p`,
  rendered exactly like `EmptyState`'s (same classes on whichever element is chosen).
- `docs/ARCHITECTURE.md` 7.3: list `titleAs` for `ErrorState` as it is for `EmptyState`, with
  the rule "an `error.tsx` that replaces a whole page passes `h1`".
- `tests/unit/foundation-kit.test.ts`: the title renders as `<p>` by default and as `<h1>` with
  `titleAs="h1"`.

## After it lands (WS-G)

`src/app/[locale]/school/error.tsx` passes `titleAs="h1"`. Nothing else in WS-G changes.

## Workaround in place

None. A visually hidden `<h1>` next to `ErrorState` would make screen readers read the title
twice (the `role="alert"` region announces it too), so WS-G waits for the prop.

## Change (landed)

- `src/components/ui/ErrorState.tsx`: `titleAs?: 'p' | 'h1' | 'h2' | 'h3'` (default `'p'`),
  rendered like `EmptyState`'s: the same classes (`mt-4 text-base font-semibold text-ink`) on
  whichever element is chosen, so the look does not change (Tailwind's base styles reset a
  heading's size, weight and margin). The comment on `onRetry` now names Next 16's `retry` prop
  instead of `reset`.
- The ten `error.tsx` files of `src/app/[locale]` pass `titleAs="h1"`: the locale root,
  `(auth)`, `(public)`, `(shared)`, `admin`, `school`, and the `(shell)` and `(player)` groups of
  `student` and `teacher`. Each one replaces the whole page, its `PageHeader` included, and none
  renders inside something that already has a heading: `AppShell`, `AuthShell`, `PublicShell`,
  the `(shared)` header bar and the bare `(player)` and locale-root wrappers have none (the
  lesson side pane's `<h2>` belongs to `LessonPlayer`, which the page renders), and an
  `error.tsx` also replaces the nested layouts below it. So `h1` is the level everywhere. This
  includes the change WS-G planned for `school/error.tsx`, so nothing is left for WS-G to do.
- `docs/ARCHITECTURE.md` 7.3: `ErrorState`'s props in the list of primitives, and a bullet with
  its behaviour and the rule "an `error.tsx` that replaces a whole page passes `'h1'`".
- `tests/unit/foundation-kit.test.ts`: the title is a `<p>` by default (and the state has no
  heading), and an `<h1>` with `titleAs="h1"`, with the same classes (English and French default
  copy). The file's render helper now also loads the `errors` catalog.

Checked in Chromium (dev server on the emulators, seed data untouched), in English at 1366 px
and in French at 375 px, before and after the change:

- `/en/school` and `/fr/school` for a new school admin whose `schoolId` points to a school that
  does not exist (created with the Admin SDK in a scratch script). Before: the school
  `error.tsx`, with no `h1`–`h6` on the page. After: one `<h1>` ("Something went wrong" / "Une
  erreur s’est produite") in `main`, inside the `role="alert"` region.
- Three other areas, reached with a reserved document id (`__x__`, which Firestore rejects, so
  the page throws): `(shared)` `/certificates/__x__` (teacher), `student/(shell)`
  `/student/projects/__x__` (individual student), `teacher/(shell)` `/teacher/projects/__x__`.
  The result is the same: no heading before, one `<h1>` after.
- The screenshots of the whole page and of the `ErrorState` alone are pixel-identical before and
  after, for all four pages in both locales.

The `(auth)`, `(public)`, `admin`, locale-root and two `(player)` error pages had no safe
trigger. They render the same component with the same prop, and their layouts were read.
