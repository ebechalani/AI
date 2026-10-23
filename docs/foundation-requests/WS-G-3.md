# WS-G-3: "Close the code" in WS-E's `JoinCodePanel` drops the keyboard focus to `<body>`

- **From:** WS-G (School admin), found in the WS-G build (deviation M12) and confirmed by the
  round FGH integration gate, 2026-10-23
- **Status:** open.
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
