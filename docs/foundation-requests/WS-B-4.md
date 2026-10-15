# WS-B-4: keyboard focus and jump targets hidden under the lesson player's sticky bars

- **From:** WS-B, area player (lesson player), 2026-10-15; revised 2026-10-15 after review
  (the padding must leave the bars themselves out)
- **Status:** closed. Landed by the foundation maintainer on 2026-10-15: `LessonShell`
  measures its top bar and its bottom stack with a `ResizeObserver` into `--lesson-*`
  properties on `<html>`, and `globals.css` pads the root with them only while focus is inside
  `#main-content`, with a `scroll-margin-top` on the jump targets otherwise; `FieldReveal`
  brings a keyboard-focused multi-line field wholly out from under the bars. The player's
  `<main>` also keeps its end room for the floating tutor button from `sm` to `xl`. WS-B's
  `LessonScrollPadding` stopgap is deleted. See "Change (landed)" below.
- **Frozen files concerned:** `src/components/layout/LessonShell.tsx`
- **Related:** WS-B-3 (the same problem in the student `AppShell`)

## Problem

`LessonShell` has a sticky top bar (`header`, `sticky top-0`) and a sticky footer
(`sticky bottom-0`). Below `xl`, the floating "Ask Robo AI" button sits on top of the footer.
Measured in Chromium (emulator seed, en and fr):

| Part | Height |
| --- | --- |
| Top bar | 99 px; 123 px on phones (below `sm`); 139 px when the stepper wraps to two rows (fr at 640–768 px, fr at 1366 px, en at 640 px) |
| Footer | 93 px with the "n steps left" line |
| Footer + floating tutor button (below `xl`) | 153 px |

When a keyboard user tabs to a control that is inside the viewport but under one of these
bars, the browser does not scroll, because the control counts as visible. The focused control
and its focus ring stay hidden. This fails WCAG 2.2 SC 2.4.11 *Focus Not Obscured (Minimum)*
(AA), and 11.2 asks for "usable … by keyboard". Fragment links (the stepper chips, the
checklist links, "n steps left") have the same problem with the top bar.

## Failing case (Chromium, emulator seed, without the workaround)

A fresh enrolled student opens `/en/student/learn/courses/my-first-ai-adventure/lessons/m1-l1`,
focuses `#main-content` and presses Tab:

- 375 × 812: "Start again" (code activity) has focus at `bottom: 797px`. The footer starts
  at `743px`, so the button is entirely hidden.
- 1366 × 900: the "Show a hint" summary has focus at `bottom: 891px`. The footer starts at
  `831px`.
- 1366 × 900 on `m1-l2`: the checklist link "Pass the quiz “Check: meet AI”" has focus at
  `bottom: 900px`, under the footer at `807px`.

`scroll-margin` on the focusable elements does not help: Chromium still does not scroll an
element that is inside the viewport. Root `scroll-padding` does help.

## The padding must not cover the bars themselves

The bars are inside the padded strips. A root padding that applies all the time makes every
Tab or Shift+Tab between the bars' own controls (outline button, stepper chips, exit link;
Previous, Complete, "n steps left", Next) scroll the page by 320–400 px. A sticky bar stays
put, so the next Tab inside it scrolls again, and the learner loses their place. The xl outline
pane's links moved the page by about 47 px per Tab. (Found in review of the first version of
the workaround, which used `html{scroll-padding-block:10rem 9rem}` unconditionally.)

## Wanted change

`LessonShell` keeps focused controls and jump targets clear of its own bars while it is
mounted, and only while focus is inside `#main-content`:

- While focus is inside `#main-content`: root `scroll-padding-block` of the header's height and
  of the bottom stack's height (footer plus, below `xl`, the floating tutor button), plus the
  4 px of the focus ring and a small margin. Measuring them (a `ResizeObserver`, so a wrapping
  stepper or the footer's "steps left" line count) is better than fixed values.
- While focus is anywhere else (a bar, the outline, the tutor, nothing): no root padding, and
  the jump targets (`[id^="stage-"]`, `[id^="block-"]` inside `#main-content`) get a
  `scroll-margin-top` of the header's height instead, so a chip or a link in a bar still lands
  its target below the top bar.

It restores the previous values on unmount, as it already does for `overflow` while a pane is
open. The values must be the player's own: the `(player)` route has no `MobileNav`, so a global
student rule like the one WS-B-3 proposes would give the player the wrong padding (and an
inline value on `<html>` overrides a stylesheet rule anyway).

Optionally, the floating "Ask Robo AI" button could leave the content's lower right corner
free (or the bottom padding could include it, as above). With the padding in place, Chromium
still leaves a control that is partly inside the padded zone where it is, so a tall field or a
row near the bottom can end up with its lower right corner under the button (2.4.11 AA allows
partly covered; seen for the 8-row code field at 375 × 812 and a checklist link at 768 × 900).

## Workaround (WS-B; deleted when this request landed, 2026-10-15)

- `src/components/lesson/LessonScrollPadding.tsx` renders, inside the player:

  ```css
  html:has(#main-content :focus){scroll-padding-block:10rem 10.5rem}
  @media (width>=80rem){html:has(#main-content :focus){scroll-padding-bottom:7rem}}
  html:not(:has(#main-content :focus)) #main-content :is([id^="stage-"],[id^="block-"]){scroll-margin-top:10rem}
  ```

  It is server-rendered, so it works before hydration, and React removes it when the learner
  leaves the lesson. The CSP allows inline styles. `tests/unit/ws-b-player-focus.test.ts`
  pins the rules down.
- `LessonPlayer` renders it, and the stage sections and blocks carry no `scroll-mt-*` of their
  own.

Checked in Chromium on fresh accounts, `m1-l1` and `m1-l2`, en at 1366 × 900, fr at 375 × 812
and 768 × 900, and the school admin's `/preview` at 1366 and 375:

- Tab and Shift+Tab inside the top bar, the footer and the xl outline: the page does not move
  (scrollY unchanged after each key).
- Tab and Shift+Tab through `<main>`: no focused control is entirely hidden.
- Stepper chips, checklist links and "n steps left" land their target at 160 px, below a bar
  of 99–139 px (or at the end of the page).

When this lands, delete `LessonScrollPadding.tsx`, its `<LessonScrollPadding />` line in
`LessonPlayer.tsx` and its `describe` block in `tests/unit/ws-b-player-focus.test.ts`.

## Change (landed)

Landed by the foundation maintainer on 2026-10-15, as wanted (padding only while focus is
inside `#main-content`, a margin on the jump targets otherwise, measured bars), plus two fixes
(the player's end room, and multi-line fields, found in review):

- `src/components/layout/lesson-scroll-padding.ts` (layout-private, client):
  `useLessonScrollPadding(headerRef, stackRef, parts)` runs `watchLessonBars(header, stack,
  style)`, which observes the top bar, the bottom stack and the stack's parts with a
  `ResizeObserver` and sets on `<html>`
  `--lesson-scroll-top` (top bar + 24 px), `--lesson-scroll-bottom` (bottom stack + 24 px) and
  `--lesson-jump-top` (top bar + 16 px); it restores the previous values on unmount. The bottom
  stack runs from the top of the floating "Ask Robo AI" button (while it shows, below `xl`) to
  the bottom of the footer. The 24 px are the focus ring and the top of a text field: on focus
  the browser scrolls a field's caret line, not its box, clear of the padding, so with 12 px
  the reflection textarea of `m1-l2` (fr, 768 × 900) stayed 2 px under the 139 px top bar.
- `src/components/layout/LessonShell.tsx`: `data-lesson-shell` on the root, refs on the
  header and the bottom stack, the hook and `<FieldReveal />`. `<main>`'s end room for the floating button was
  `max-xl:pb-24` next to `sm:py-8`, and `sm:py-8` won from 640 to 1279 px (`cn()` does not merge
  utilities, 7.1): the end of the lesson kept 32 px instead of 96 px, so the last checklist link
  could not scroll clear of the button (seen at fr 768 × 900). It is now `pt-6 sm:pt-8` with
  `pb-24 xl:pb-8` when the tutor is on (`pb-6 sm:pb-8` otherwise).
- `src/app/globals.css` (`@layer base`): `html:has([data-lesson-shell] #main-content :focus)` →
  `scroll-padding-top: var(--lesson-scroll-top, 10rem); scroll-padding-bottom:
  var(--lesson-scroll-bottom, 10.5rem)` (fallback `7rem` from `xl`); otherwise
  `[data-lesson-shell] :is(#main-content, #main-content [id])` → `scroll-margin-top:
  var(--lesson-jump-top, 10rem)`. The fallbacks are the stopgap's values, for the first paint.
  `#main-content` itself is a jump target too, for the `/preview` skip link.
- `src/components/layout/field-reveal.ts` (layout-private, client), `FieldReveal`, rendered by
  `LessonShell` and `AppShell`. On focus the browser scrolls a text field's caret line, not its
  box, clear of the padding, so a multi-line field whose first line was already on screen
  stayed partly under the bottom stack: after the "Ask AI" stepper chip and Tab, the
  reflection textarea of `m1-l2` kept 40 of its 160 px (ring included) under the footer at en
  1366 × 768, and 79 px at fr 1366 × 768 and en 375 × 812; a plain Tab walk left the 8-row code
  field of `m1-l1` and `m2-l1` 23–53 px under the stack or the tutor button at 320, 375, 1024
  and 1366 px. The stopgap did the same or worse (2.4.11 AA was met: never entirely hidden).
  On `focusin` of a `<textarea>` or an editable region inside `#main-content`, `FieldReveal`
  calls `scrollIntoView({ block: 'nearest', inline: 'nearest' })`, before the browser's caret
  scroll; it skips focus caused by a pointer press, which it would turn into a selection.
- `docs/ARCHITECTURE.md` 7.5 ("Scroll padding"); `tests/unit/shell-scroll-padding.test.ts`: the
  rules, `<main>`'s end room (no `py-` utility, `pb-24 xl:pb-8` with the tutor),
  `watchLessonBars` with a fake observer and style (measures, re-measures, restores the previous
  values when stopped), `FieldReveal`.
- Deleted: `src/components/lesson/LessonScrollPadding.tsx`, its line in `LessonPlayer.tsx` and
  its `describe` block in `tests/unit/ws-b-player-focus.test.ts`; the comments in
  `LessonContent.tsx` and `focus.ts` now name `LessonShell`.

Checked in Chromium on `student@demo`, `m1-l2` (not completed by the checks):

- Measured values: 375 × 812 en: top bar 123, bottom stack 153 → padding 147 / 177 px;
  1366 × 900 en: 99 / 93; fr 1366 × 900 and fr 768 × 900: top bar 139 (the stepper wraps).
- Tab and Shift+Tab through the whole page at 375 × 812 and 1366 × 900 (en), and 375 × 812,
  768 × 900 and 1366 × 900 (fr): 0 focus stops under the top bar, the footer or the tutor
  button, and Tab between controls of the same bar or of the xl outline never scrolls. (This
  walk does not reach a field after a jump; see the re-check with `FieldReveal` below.)
- Stepper chips, the checklist links and "n steps left" land their target 16 px below the top
  bar (139 px under 123, 115 px under 99, 155 px under 139), 24 px for `#stage-earn`, which
  takes focus so the padding applies instead of the jump margin (147 px under 123), or at the
  end of the page. Keyboard and mouse, from the top and from the bottom, en and fr.
- After leaving the lesson for the course page, `<html>` has no `style` left and the AppShell
  rules apply again.
- School admin `/en/preview/my-first-ai-adventure/lessons/m1-l1`, 375 × 812: the skip link puts
  the lesson title at 171 px, below the 115 px top bar.

Re-checked with `FieldReveal` and the `watchLessonBars` refactor (2026-10-15, `student@demo`):

- A Tab and Shift+Tab walk that counts any fixed or sticky element over the 4 px ring: en
  `m1-l1` and `m1-l2` at 320 × 640, 375 × 812, 768 × 1024, 1024 × 768 and 1366 × 768; fr `m1-l2`
  and `m2-l1` at 320 × 640, 375 × 812, 768 × 900, 1024 × 768 and 1366 × 768: 0 focus stops
  covered (before: the code field, at 4 en and 5 fr stops), and no scroll between controls of
  the same bar.
- "Ask AI" stepper chip, then Tab to the reflection textarea of `m1-l2`: wholly clear of both
  bars at en 1366 × 768, fr 1366 × 768, en 375 × 812, en 320 × 640 and fr 768 × 900. Shift+Tab
  back to it with its top 50 px above the bottom stack: wholly clear. A mouse press on the same
  partly hidden field: the page does not move.
- `<main>`'s bottom padding: 96 px at 320, 639, 640, 768, 1024 and 1279 px, 32 px at 1280 and
  1366; the end of the content (511 px) stays above the tutor button (547 px) below `xl`.
- The variables follow a resize (1366 → 1200: `--lesson-scroll-bottom` 117 → 177 px) and are
  removed when the lesson is left.
