# WS-G-3: "Close the code" in WS-E's `JoinCodePanel` drops the keyboard focus to `<body>`

- **From:** WS-G (School admin), found in the WS-G build (deviation M12) and confirmed by the
  round FGH integration gate, 2026-10-23
- **Status:** closed. Landed by the foundation maintainer on 2026-10-23.
- **Owner of the file concerned:** WS-E (`src/components/classes/JoinCodePanel.tsx`, read-only
  for WS-G, which renders it on `/school/classes/[classId]`)

## Problem

`setEnabled(false)` ends with `settleAndRestoreFocus(() => setBusy(null), () => toggleRef.current)`.
Since WS-E-2 a loading `Button` keeps the focus, so when the request settles the focus is still
on "Close the code" and `settleAndRestoreFocus` does nothing. The `router.refresh()` that follows
then removes "Close the code" (it is rendered only while the code is open), and Chromium moves
the focus to `<body>`: a keyboard user is thrown back to the top of the page. "Open for 24 hours"
and "Extend to 24 hours from now" are not affected (the toggle stays in the page).

## Failing case (checked in Chromium, emulator seed, 2026-10-23)

`teacher@demo` on `/en/teacher/classes/<a class with an open code>` (also `schooladmin@demo` on
`/en/school/classes/<id>`): focus "Close the code", press Enter. `document.activeElement` is the
button during the request and `<body>` once the panel shows "Closed" (gate script
`tour-d.mjs`, step D1b).

## Wanted change

In `JoinCodePanel.setEnabled`, when `enabled` is false and the request succeeded, move the focus
to the toggle ("Open for 24 hours") once the refreshed panel renders it, for example by
remembering `focusToggleAfterRefresh` in a ref and focusing `toggleRef.current` in an effect that
runs when `isOpen` turns false. A unit or browser check: after "Close the code" by keyboard,
`document.activeElement` is "Open for 24 hours".

## Workaround in place (WS-G)

None: the panel is WS-E's and is used as is.

## Change (landed)

- `src/components/classes/JoinCodePanel.tsx`:
  - after a successful "Close the code", `setEnabled` sets the ref `focusToggleAfterRefresh`
    (a successful open or extend clears it). A layout effect on `isOpen` gives the focus to the
    toggle ("Open for 24 hours") once the refreshed panel shows the code closed, but only when
    the focus is then on `<body>` (or nowhere), so focus the user moved elsewhere during the
    request stays there. A layout effect rather than a passive one, so that the toggle has the
    focus before the browser paints the refreshed panel: with `useEffect`, Chromium showed
    `<body>` for one frame between the commit and the effect (caught once in eight sampled runs,
    at 375 px). `isOpen` is now computed before the `schoolJoinCodesOff` early return, since the
    effect is a hook;
  - the same gap on the failure path: on `conflict`, `not_found` or `unauthenticated`,
    `reportToggle` starts a refresh that takes the whole panel away (an archived class has no
    aside). `settleAndRestoreFocus` found the focus still on the pressed button (WS-E-2), so it
    never handed it to `<main>`, and the browser dropped it to `<body>`. `<main>`
    (`#main-content`) now takes the focus as soon as the request settles, before the refreshed
    page renders, as `reportRegenerate` already does for "New code";
  - "Open for 24 hours" and "Extend to 24 hours from now" are unchanged: the loading toggle keeps
    the focus and is the same element after the refresh. `settleAndRestoreFocus` stays: it
    renders the end of the pending state with `flushSync` and finds the focus where it was.
- `docs/ARCHITECTURE.md`: no change. It does not describe `JoinCodePanel`'s focus handling (the
  panel is WS-E's), and nothing in it contradicts the change: 7.1 asks for `router.refresh()`
  after a successful action, and 7.3 for a loading `Button` that keeps the focus.
- No unit test: the behaviour is a React layout effect timed against `router.refresh()`. The unit
  suite runs in Node without a DOM or a renderer that runs effects, so it is checked in Chromium.

Checked in Chromium against the dev server, on Gate Class mvkq9za9 (its code was closed and is
closed again; Grade 6 A was not touched), as `teacher@demo` on
`/{en,fr}/teacher/classes/<classId>` and as `schooladmin@demo` on
`/{en,fr}/school/classes/<classId>`, at 1366 and 375 px, with `document.activeElement` sampled
every few milliseconds:

- Enter on "Close the code" (gate step D1b): the focus is on the button (with `aria-busy`)
  during the request. After the refresh it is on "Open for 24 hours" / "Ouvrir pour 24 heures",
  with its focus ring. `<body>` never appears in 18 keyboard closes in a row. Before the change:
  `<body>`.
- Enter on "Open for 24 hours" and on "Extend to 24 hours from now": the focus stays on the
  toggle throughout, as before.
- Tab to "Copy code" while a close is in flight (the server action held 1.5 s): the focus stays
  on "Copy code".
- A mouse click on "Close the code": the toggle takes the focus, without a focus ring.
- The class marked archived in the emulator while the panel was open (the field reset
  afterwards): "Close the code" shows the archived toast, and the focus is on `<main>` once the
  panel is gone. Before the change: `<body>`.
