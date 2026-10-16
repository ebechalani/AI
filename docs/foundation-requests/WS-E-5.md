# WS-E-5: `Tabs` can leave the selected tab off-screen, with no sign that the list scrolls

- **From:** WS-E (Teacher workspace; review fix round), 2026-10-16
- **Status:** open
- **Frozen files concerned:** `src/components/ui/Tabs.tsx`

## Problem

The tab list scrolls sideways with its scrollbar hidden. A click scrolls the clicked tab into
view, but nothing does so for the tab selected when the list mounts (`defaultValue` from the
URL) or for a tab reached with the arrow keys (`focus()` does not bring a partly visible tab
fully into view). Nothing shows that more tabs exist past the edge either.

## Failing case (checked in Chromium, `teacher@demo`, 375 px, before the WS-E workaround)

- `/en/teacher/courses`: the list is 432 px wide in 343 px; after ArrowRight three times the
  focused, selected "My courses" sits at x = 345–448 while the list ends at 359.
- `/fr/teacher/courses?tab=mine`: the "Mes cours" panel is shown and its tab is entirely
  off-screen (x = 422–517).

## Wanted change

In `Tabs.tsx`: on mount, and after a keyboard selection, call `scrollIntoView({ block:
'nearest', inline: 'nearest' })` on the selected tab, or set the list's `scrollLeft` so only
the list moves (`block: 'nearest'` can also scroll the page). And an overflow cue: a fade at the
edge that has more tabs (for example a `mask-image` gradient toggled by a `data-overflow-start`
/ `data-overflow-end` attribute kept up to date on `scroll` and with a `ResizeObserver`).

## Workaround in place (WS-E)

`src/components/teacher/RevealingTabs.tsx` wraps `Tabs` for the course catalog: on mount and on
every focus of a tab it scrolls the list (never the page) so that tab is whole. The French label
`teacher.courses.tabs.academy` is now "Académie", so the list is 386 px instead of 501 px. There
is no overflow cue yet. The wrapper can go once this lands.
