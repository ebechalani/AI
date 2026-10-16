# WS-MAINT-1: the public header is wider than a 320 px screen in French

- **From:** the WS-K/foundation review (suggested task "Fix public header overflow at 320 px in
  French"), 2026-10-16
- **Status:** closed. Landed by the foundation maintainer on 2026-10-16.
- **Frozen files concerned:** `src/components/layout/PublicHeader.tsx`,
  `src/components/layout/LocaleSwitcher.tsx`, `docs/ARCHITECTURE.md` (7.5)

## Problem

At 320 px in French the public header row needs 335 px (logo mark, language button "FR",
"Se connecter", "Commencer"), so `/fr`, `/fr/pathways` and `/fr/verify/<code>` scroll sideways
(`scrollWidth` 335). English fits (320). At 375 px French fits with 3 px to spare.

## Change (landed)

Below 360 px only (Tailwind `max-[22.5rem]` / `min-[22.5rem]`), so 360 px and up are unchanged:

- `src/components/layout/LocaleSwitcher.tsx`: `compact?: boolean | 'narrow'` (additive). `'narrow'`
  drops the language code only below 360 px; the globe stays, and the button's accessible name
  still names the language ("Langue : Français"). `true` keeps its meaning (below `sm`).
- `src/components/layout/PublicHeader.tsx`: `<LocaleSwitcher align="start" compact="narrow" />`,
  and the row gap is 4 px below 360 px (6 px from 360 px, 12 px from `sm`, as before).
- `docs/ARCHITECTURE.md` 7.5: the `LocaleSwitcher` props.

"Se connecter" wraps onto two lines inside its button below 375 px (it already did at 360 px
before this change); the header keeps its height (65 px) and nothing overflows.

Checked in Chromium (`document.documentElement.scrollWidth` against the viewport, and screenshots):

| Width | `/fr`, `/fr/pathways`, `/fr/verify/…` | `/en`, `/en/pathways` | Signed in (Sam), `/fr` and `/en` |
| --- | --- | --- | --- |
| 320 | 320 (was 335) | 320 | 320 ("Accéder à mon espace") |
| 359 | 359 | 359 | — |
| 360, 375, 1366 | unchanged (positions identical to before) | unchanged | fits |
