# WS-E-6: a `StatCard` label overflows its card in a narrow grid column

- **From:** WS-E (Teacher workspace; review fix round), 2026-10-16
- **Status:** closed. Landed by the foundation maintainer on 2026-10-16.
- **Frozen files concerned:** `src/components/domain/StatCard.tsx`

## Problem

The label and the value sit beside a 44 px icon with a 16 px gap, inside 20 px of padding. In a
two-column grid at 375 px, or a four-column grid at 1024 px (beside the 256 px sidebar), that
leaves about 62 px for the text: single words such as "Progression", "d’évaluation" or
"Certificates" run into the padding to the card's edge, and the value "50 %" (with its no-break
space) breaks into "50" and "%" because the value has `break-words`.

## Failing case (checked in Chromium, `teacher@demo`, before the WS-E workaround)

- 375 px, `/fr/teacher/reports`: "Progression moyenne" ends at x = 357 for an inner edge at 339,
  and "50 %" takes two lines; `/fr/teacher`: "En attente d’évaluation" ends at 178 for 160.
- 1024 px, `/en/teacher/reports`: "Certificates issued" ends at 987 for 972.

## Wanted change

In `StatCard.tsx`: `break-words hyphens-auto` on the label, `whitespace-nowrap` on the value
(numbers and short values only), and optionally a way to put the icon above the text below a
width (for example `flex-col` below `sm` through a `layout` prop). ARCHITECTURE.md 7.4 could say
that a stat grid gives each card at least about 180 px.

## Workaround in place (WS-E)

`DashboardStats` and `ReportSummary` use `grid-cols-1 min-[440px]:grid-cols-2 xl:grid-cols-4`
instead of `grid-cols-2 lg:grid-cols-4`: every label fits (en and fr) at 375, 1024, 1280 and
1366 px. Other workstreams' stat grids are not changed.

## Change (landed)

- `src/components/domain/StatCard.tsx`:
  - label: `break-words hyphens-auto` (hyphenated in the page's `lang`);
  - value: never broken inside a word. A number (formatted by `StatCard`) is `whitespace-nowrap`;
    a text value loses `break-words`, so "50 %" (no-break space) stays whole and a value of
    several words ("Not passed", a date) wraps between words only. `whitespace-nowrap` on every
    value, as asked, was measured first and rejected: WS-C's attempt overview passes "Not passed"
    / "Non réussi" and a date in a four-column grid (167 px cards at 1024 px), where they would
    run up to 28 px into the card's padding and 8 px past its edge (68 px past it with the icon
    beside the text), and the date still 4 px past the edge at 1280 px;
  - the optional layout, without a prop: the icon row wraps (`flex-wrap`, the text block
    `flex-1 basis-20`), so in a card narrower than about 180 px the text moves under the icon and
    takes the whole width; wider cards look as before.
- `docs/ARCHITECTURE.md` 7.4: a stat grid gives each card about 180 px or more, and the label and
  value rules.
- `tests/unit/foundation-kit.test.ts`: the label classes, a number `nowrap` (French grouping with
  its narrow no-break space), "50 %" without `break-words` or `nowrap`, the wrapping row.

Checked in Chromium with the real components (`DashboardStats`, `ReportSummary`, `StatsGrid`,
`AttemptOverview`, and a `StatCard` in the Student Home grid), the real `en` and `fr` catalogs and
the app's compiled CSS and Inter font, inside a replica of `AppShell`'s content column (signed-in
pages could not be opened: the Auth emulator was down), at 375, 440, 1024, 1280 and 1366 px:
no label or value crosses its card's padding in any grid, in either language, and no value is
broken inside a word; the student home, teacher dashboard and Reports grids keep every card at
196 px or more (343 at 375 px, 196 at 440, 344 at 1024, 228 at 1280, 250 at 1366). Only
`AttemptOverview` at 1024 px (167 px cards) is below 180 px: its text now sits under the icon
there, and "Non réussi" and the date wrap between words. WS-E's grid workaround
(`grid-cols-1 min-[440px]:grid-cols-2 xl:grid-cols-4`) can stay.
