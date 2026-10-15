# WS-B-3: keyboard focus hidden under the student TopBar and bottom bar

- **From:** WS-B, area home (Student Home), 2026-10-15
- **Status:** closed. Landed by the foundation maintainer on 2026-10-15: `AppShell` marks
  its root `data-app-shell="{role}"` and `globals.css` pads the root while focus is inside
  `#main-content` (top 5.5rem for every role, bottom `calc(5.5rem + env(safe-area-inset-bottom))`
  below `lg` for students), with a 5rem `scroll-margin-top` on the content's jump targets
  otherwise; `FieldReveal` brings a keyboard-focused multi-line field wholly out from under the
  bars. WS-B's `StudentScrollPadding` stopgap is deleted. See "Change (landed)" below.
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

## Workaround (WS-B; deleted when this request landed, 2026-10-15)

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

## Change (landed)

Landed by the foundation maintainer on 2026-10-15, in the shell rather than per page, with
three differences from the wanted change, found while verifying it and in review:

- **Padding only while focus is inside `#main-content`.** An unconditional root padding (the
  wanted change, and the stopgap) puts the sticky TopBar inside the padded strip, so the page
  jumped whenever a TopBar control got focus from mid-page: `student@demo`, `/en/student`,
  375 × 812, scrolled to 800, opening the language menu with the mouse moved the page to 425
  (focus moves into the menu) and Escape moved it again to 59 (focus returns to the trigger);
  Tab between the TopBar's own controls scrolled by about 366 px each time. While focus is
  anywhere else, `#main-content` and every element with an `id` inside it get a 5rem
  `scroll-margin-top` instead, so the skip link and fragment links still land below the
  TopBar.
- **Top 5.5rem, not 4.5rem.** On focus the browser scrolls a text field's caret line, not its
  box, clear of the padding, so a field's border and inner padding (about 14 px) end up above the
  padded edge. With 4.5rem (72 px) a kit-styled textarea reached by Shift+Tab stayed at 60 px,
  its focus ring 9 px under the 65 px TopBar; with 5.5rem it lands at 74 px.
- **Multi-line fields revealed whole.** For the same reason, Tab to a multi-line field whose
  first line is already above the bottom bar leaves the rest of it under the bar: a 5-row
  textarea on `/en/student` (injected; no shell page has one yet) kept 66 of its 150 px under
  the MobileNav at 375 × 812 and 768 × 1024 (never entirely hidden, so 2.4.11 AA was met).
  `FieldReveal` (shared with `LessonShell`, WS-B-4) scrolls such a field wholly clear.

Files:

- `src/components/layout/AppShell.tsx`: `data-app-shell={role}` on the root, and
  `<FieldReveal />` next to `SkipLink`.
- `src/components/layout/field-reveal.ts` (layout-private, client): on `focusin` of a
  `<textarea>` or an editable region inside `#main-content`, `scrollIntoView({ block:
  'nearest', inline: 'nearest' })`, except for focus caused by a pointer press.
- `src/app/globals.css` (`@layer base`): `html:has([data-app-shell] #main-content :focus)`
  → `scroll-padding-top: 5.5rem`; below `64rem`,
  `html:has([data-app-shell='student'] #main-content :focus)` → `scroll-padding-bottom:
  calc(5.5rem + env(safe-area-inset-bottom))` (staff have no bottom bar); otherwise
  `[data-app-shell] :is(#main-content, #main-content [id])` → `scroll-margin-top: 5rem`. The
  rules match only while `AppShell` is mounted, so the lesson player (no `AppShell`) keeps its
  own (WS-B-4).
- `docs/ARCHITECTURE.md` 7.5 ("Scroll padding").
- `tests/unit/shell-scroll-padding.test.ts` pins the rules down.
- Deleted: `src/components/student/StudentScrollPadding.tsx`, its export in
  `src/components/student/index.ts`, its tests in `tests/unit/ws-b-home.test.ts` and the
  `<StudentScrollPadding />` line (with its comment) in the four WS-B pages; the
  `scroll-mt-24` of `PathwayCatalog`'s `#pathways` section (`learn/_components`), WS-B's
  per-element offset for the TopBar, which stacked with the shell's padding (the section takes
  focus) and put it at 184 px instead of 88 px.

Checked in Chromium (emulator seed), Tab and Shift+Tab through the whole page, measuring every
focus stop (`getBoundingClientRect`, plus the 4 px ring) against the bars:

- `student@demo`, `/en/student`, `/en/student/learn`, `/en/student/learn/courses/my-first-ai-adventure`
  at 375 × 812 and 1366 × 900: 0 focus stops under the TopBar or the bottom bar (17–25 stops per
  page and direction). The same walk with the rules switched off finds the failures of this
  request again (for example "All my courses" at `761–785px` under the bottom bar at `755px`).
- `lea.demo`, `/fr/student`, `/fr/student/learn`, the course and the AI Explorer pathway at
  375 × 812, and `/en/student`, `/en/student/learn` at 1366 × 700: 0 under a bar.
- Tab between TopBar controls, and a TopBar menu opened and closed mid-page: the page does not
  move. `teacher@demo` at 375: top padding only, no bottom padding.

Re-checked with `FieldReveal` (2026-10-15):

- The injected 5-row textarea on `/en/student` (`lea.demo`), its top 40, 80 or 120 px above the
  MobileNav, then Tab: wholly clear of both bars at 320 × 640, 375 × 812 and 768 × 1024; the
  same walk as above over `/en/student` with fields injected: 0 focus stops covered.
- `/en/student/learn#pathways`, and a `#pathways` link inside and outside `<main>`: the section
  lands at 88 px, below the 65 px TopBar, at 375 × 800 (at the end of the page at 1366 × 800).
