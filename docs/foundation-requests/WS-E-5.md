# WS-E-5: `Tabs` can leave the selected tab off-screen, with no sign that the list scrolls

- **From:** WS-E (Teacher workspace; review fix round), 2026-10-16
- **Status:** closed. Landed by the foundation maintainer on 2026-10-16.
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

## Change (landed)

- `src/components/ui/Tabs.tsx`:
  - the selected tab is brought whole into view on mount, after a keyboard or pointer selection
    and when the owner changes it, by setting the tab list's `scrollLeft` only (never the page;
    the click no longer calls `scrollIntoView`, and a keyboard move focuses with `preventScroll`),
    with a 24 px margin so the tab also clears the edge fade (the browser clamps at both ends,
    where no fade is drawn);
  - an overflow cue: `data-overflow-start` / `data-overflow-end` on the list, measured from
    `scrollLeft` (0 at the start, negative towards the end in RTL), `scrollWidth` and
    `clientWidth`, kept current on `scroll` and with a `ResizeObserver` on the list and its tabs;
    while either is set, the list is masked by two gradients (one per edge, intersected; each
    1.5rem wide while its edge has tabs past it, 0 otherwise; the directions follow `rtl`). No cue
    is rendered on the server.
- `docs/ARCHITECTURE.md` 7.3: the `Tabs` behaviour.
- `tests/unit/foundation-kit.test.ts`: no cue in the server markup, the requested tab selected.

Checked in Chromium. `/fr/teacher/courses?tab=mine` needs a teacher session, which could not be
opened (the Auth emulator was down), so the primitive was checked alone (without WS-E's
`RevealingTabs`) on a harness page with the real `Tabs` and the app's CSS, at 375 px: the French
course tabs ("Catalogue", "Académie", "Mon école", "Mes cours") opened on `mine` show "Mes cours"
whole, with the fade on the start edge only and the page not scrolled; in a list of eight tabs,
every ArrowRight leaves the focused tab whole and clear of the fade, the end cue goes at the last
tab and the start cue shows, Home brings back the first, a swipe to the middle shows both cues;
the same in a right-to-left page (`lang="ar"`, `dir="rtl"`) with ArrowLeft; at 1366 px nothing
overflows and no mask is applied. `RevealingTabs` can now be removed by WS-E (it does the same
reveal without the fade margin; both together are harmless).
