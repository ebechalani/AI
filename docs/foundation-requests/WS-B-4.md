# WS-B-4: keyboard focus and jump targets hidden under the lesson player's sticky bars

- **From:** WS-B, area player (lesson player), 2026-10-15; revised 2026-10-15 after review
  (the padding must leave the bars themselves out)
- **Status:** open. A workaround is in place in WS-B's own files (below), so nothing is
  blocked. 11.2's definition of done asks for no open foundation request, so either the
  foundation maintainer lands the change below (and WS-B deletes the workaround), or the
  orchestrator closes this request as an accepted workaround.
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

## Workaround in place (WS-B, to delete when this lands)

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
