# WS-B-3: keyboard focus hidden under the student TopBar and bottom bar

- **From:** WS-B, area home (Student Home), 2026-10-15
- **Status:** open. A workaround for WS-B's shell pages (Student Home, Learn, pathway, course
  detail) is in place in WS-B's own files (below). The other student pages still need the
  shell-wide rule.
- **Frozen files concerned:** `src/app/globals.css` (or `src/components/layout/AppShell.tsx`)
- **Related:** WS-B-4 (the same problem in the lesson player's `LessonShell`)

## Problem

`AppShell`'s `TopBar` is `sticky top-0` at every width (about 4 rem). Below `lg`, the student
`MobileNav` is a fixed bar along the bottom (`fixed inset-x-0 bottom-0`, 3.5 rem plus the safe
area). When a keyboard user tabs to a link that sits in the strip of the viewport covered by
one of the two bars, the browser does not scroll: the element is inside the viewport, so it
counts as visible. With Shift+Tab, the browser scrolls a link from above the viewport only up
to the top edge, which is under the TopBar. The focused element and its focus ring then stay
hidden behind the bar. This fails WCAG 2.2 SC 2.4.11 *Focus Not Obscured (Minimum)*, AA, and
11.2 asks for "usable … by keyboard".

It affects every student page whose content is taller than the viewport. The `pb-24` on
`<main>` only adds room at the end of the page. It does not help while scrolling.

## Failing cases (checked in Chromium, emulator seed, without the workaround)

1. `student@demo.roboholic.test`, `/en/student`, 375 × 812. Click the page background, then
   press Tab three times: "See your achievements", "Open the AI tutor", then "All my courses".
   "All my courses" has focus at `top: 761px … bottom: 785px`. The bottom bar starts at
   `755px`, so the link and its outline are hidden and the page does not scroll. The same
   happens later with the first challenge card's link (`top: 770px`). 4 of 24 focus stops in
   `<main>` are hidden (the Tab order wraps once).
2. `lea.demo`, `/fr/student`, 375 × 812, Tab: "Explorateur IA" (`744–765px`) and "Défi de la
   semaine …" (`748–790px`) are hidden. Shift+Tab from the end of `<main>`: 8 of 27 focus
   stops end up under the TopBar (`bottom: 65px`), for example "Ouvrir le tuteur IA" at
   `13–49px`.
3. `lea.demo`, `/en/student`, 1366 × 700 (no bottom bar), Shift+Tab: 5 of 26 focus stops end
   up under the TopBar, for example "Open the AI tutor" at `0–36px`.

## Wanted change (verified)

One global rule, for example in `globals.css` `@layer base`:

```css
html {
  /* the sticky TopBar (~4 rem), at every width */
  scroll-padding-top: 4.5rem;
}
@media (width < 64rem) {
  html {
    /* the student MobileNav (~3.5 rem plus the safe area) */
    scroll-padding-bottom: calc(5.5rem + env(safe-area-inset-bottom));
  }
}
```

Staff areas have no bottom bar, so the foundation might prefer to apply the bottom value only
to the student shell, for example as a `max-lg:scroll-pb-*` class on `<html>` or an `AppShell`
wrapper. The `(player)` route has its own bars and its own padding (WS-B-4), so the rule must
not reach the lesson player, or the player's value must win there. Either way it is
foundation code.

## Workaround in place (WS-B, to delete when this lands)

- `src/components/student/StudentScrollPadding.tsx` renders the rule above as a `<style>`
  (`html{scroll-padding-top:4.5rem}@media (width<64rem){html{scroll-padding-bottom:calc(5.5rem + env(safe-area-inset-bottom))}}`).
  WS-B's four shell pages render it once each: `src/app/[locale]/student/(shell)/page.tsx`,
  `learn/page.tsx`, `learn/pathways/[pathwayId]/page.tsx` and `learn/courses/[courseId]/page.tsx`
  (all under `src/app/[locale]/student/(shell)/`). It is server-rendered, so it works before
  hydration, and React removes it when the learner leaves the page (checked: after a
  client-side navigation away from these pages the root padding is `auto` again). The CSP
  allows inline styles. The lesson player is not covered: it has its own bars and its own
  rule (WS-B-4).

Checked in the browser with the workaround: Tab and Shift+Tab through `<main>` of
`/student` leave no focused element under either bar for `student@demo` (en), `lea.demo`
(fr, and en at 1366 × 700), `omar.demo` (fr), `maya.demo` (en) and a fresh student (fr), at
375 × 812. The integration gate (2026-10-15) found the same problem on the Learn pages before
they rendered the workaround: `student@demo`, `/en/student/learn`, 375 × 812, Shift+Tab from
the end of `<main>` left the "AI Engineer" pathway link at `26–47px`, entirely under the TopBar
(`0–65px`); on `/en/student/learn/courses/my-first-ai-adventure` a lesson link (`54–74px`) and
the "Learn" breadcrumb (`56–76px`) were partly under it. With the workaround, no focus stop on
these pages is under either bar (en and fr). When this request lands, delete
`StudentScrollPadding.tsx`, its export in `src/components/student/index.ts`, its test in
`tests/unit/ws-b-home.test.ts` and the `<StudentScrollPadding />` line (with its comment) in
the four pages.
