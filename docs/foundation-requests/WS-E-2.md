# WS-E-2: a loading `Button` drops the keyboard focus to `<body>`

- **From:** WS-E (Teacher workspace; review fix round), 2026-10-16
- **Status:** open
- **Frozen files concerned:** `src/components/ui/Button.tsx` (and `docs/ARCHITECTURE.md` 7.3 if
  the rule is written down)

## Problem

`Button` renders `disabled={disabled || loading}`. A focused control that becomes disabled loses
the focus, and Chromium moves it to `<body>`. So every button that shows its spinner while a
request runs throws a keyboard user back to the top of the page the moment it is pressed, and
nothing gives the focus back when the request ends unless the caller does it by hand. The same
happens to the fields of a form that are disabled while it saves (Enter in a text field).

## Failing case (checked in Chromium, emulator seed, before the WS-E workaround)

- A teacher on a class page focuses "Open for 24 hours" (or "Extend to 24 hours from now", or
  "Close the code") and presses Enter: `document.activeElement` is `<body>` during the request
  and stays there after the refresh.
- `/en/teacher/settings`: Enter in the name field, or Enter on "Save profile" or "Save
  language": `<body>` during and after the save.
- Any confirmation dialog (`ConfirmDialog` in WS-E): the confirm button is disabled while
  loading; after a failure the dialog stays open with its error and the focus on `<body>`.

Other workstreams' loading buttons (WS-A forms, WS-B enrol, WS-C quiz submit, WS-D review, WS-J
certificate button) behave the same way.

## Wanted change

`Button` with `loading` keeps the element focusable: `aria-disabled="true"` plus a guard that
ignores `click` (and the implicit submit of a `type="submit"` button: `onClick` calling
`event.preventDefault()` while loading stops the form submission too) instead of the native
`disabled`. `aria-busy` stays. The faded look comes from `aria-disabled:` variants instead of
`disabled:`. `disabled` itself (not loading) stays native. Then the focus stays on the pressed
button for the whole request in every workstream, and screen readers still hear it as
unavailable.

## Workaround in place (WS-E)

`src/components/classes/focus.ts` adds `settleAndRestoreFocus(settle, target)`: it renders the
end of the pending state with `flushSync` and, only if the focus was dropped to `<body>`, gives it
to `target` (the element focused when the request started, else the submit button). It is used by
`JoinCodePanel` (the join-code toggle, also after "Close the code"), `ProfileForm`,
`LanguageForm`, `AwardBadgeForm` and `EnrollAcademyButton`; `ConfirmDialog` moves the focus to its
error (or back to the confirm button) once a failed request settles. The focus is still on
`<body>` while a request is in flight; this request removes that gap. The workaround can stay
once it lands (it then finds the focus where it was and does nothing).
