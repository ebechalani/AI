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
