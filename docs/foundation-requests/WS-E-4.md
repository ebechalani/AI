# WS-E-4: a table header cell cannot be allowed to wrap through `className`

- **From:** WS-E (Teacher workspace; review fix round), 2026-10-16
- **Status:** closed. Landed by the foundation maintainer on 2026-10-16.
- **Frozen files concerned:** `src/components/ui/Table.tsx` (or `src/lib/utils.ts`)

## Problem

`TableHeaderCell` always has `whitespace-nowrap`. `cn` is `clsx` and, as its comment says, does
not resolve conflicting Tailwind utilities, so a caller's `className="whitespace-normal"` ends up
next to `whitespace-nowrap` and the stylesheet order decides: `nowrap` wins. The row-header cells
of WS-E's roster, attempts, credentials and report tables passed `whitespace-normal` and never
wrapped, and long column headers ("Moyenne aux quiz", "Dernière activité") cannot wrap either. A
table with many columns then cannot shrink to fit, even where its scroll region would otherwise
not be needed (the WS-E build spec asks the eight-column class report to fit a 1366 px laptop).

## Failing case (checked in Chromium, before the WS-E workaround)

`/fr/teacher/reports` for a class with a row offering "Délivrer le certificat", 1366 px: the
student names stay on one line, the report region is 1063 px wide in a 1044 px box, and the
certificate button is cut off. Computed style of the row header: `white-space: nowrap` although
its class list holds `whitespace-normal`.

## Wanted change

Either a `wrap?: boolean` prop on `TableHeaderCell` (`whitespace-normal` instead of
`whitespace-nowrap`), or `scope="row"` cells without `whitespace-nowrap` by default (a row header
is usually a name). The general alternative, `cn` built on `tailwind-merge`, would fix every such
override in the kit at once.

## Workaround in place (WS-E)

The WS-E tables pass `whitespace-normal!` (Tailwind's important modifier): `ReportTable` (column
and row headers), `RosterTable`, `StudentAttemptsTable` and `CredentialsDialog` (row headers). The
class report now fits 1366 px in en and fr. It can be replaced by the prop once this lands.

## Change (landed)

- `src/components/ui/Table.tsx`: `TableHeaderCell` takes `wrap?: boolean` (default `false`):
  `whitespace-normal` instead of `whitespace-nowrap`, for column and row headers alike. `cn` is
  unchanged.
- `docs/ARCHITECTURE.md` 7.3: the prop, and why `className` cannot do it.
- `tests/unit/foundation-kit.test.ts`: `nowrap` by default; with `wrap`, `whitespace-normal` and
  no `whitespace-nowrap`, for `scope="col"` and `scope="row"`.

WS-E's `whitespace-normal!` workaround keeps working; WS-E may switch to `wrap` when it next
touches those tables.
