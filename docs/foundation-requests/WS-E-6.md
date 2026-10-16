# WS-E-6: a `StatCard` label overflows its card in a narrow grid column

- **From:** WS-E (Teacher workspace; review fix round), 2026-10-16
- **Status:** open
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
