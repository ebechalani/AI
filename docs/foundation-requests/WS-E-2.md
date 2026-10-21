# WS-E-2: a loading `Button` drops the keyboard focus to `<body>`

- **From:** WS-E (Teacher workspace; review fix round), 2026-10-16
- **Status:** closed. Landed by the foundation maintainer on 2026-10-16.
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

## Change (landed)

- `src/components/ui/Button.tsx`: `loadingProps(loading, disabled, onClick)` (exported for
  `IconButton`) gives the state attributes. A button that is only `loading` gets
  `aria-disabled="true"` and `aria-busy="true"` and is never natively disabled, so it keeps the
  keyboard focus; its click is cancelled (`preventDefault` and `stopPropagation`), which also
  cancels the implicit submission of its form by Enter in a field (the browser submits by
  clicking the default button), and the caller's `onClick` does not run. `disabled` stays native
  (also with `loading`, then with `aria-busy`). The faded look of a loading button comes from
  `aria-disabled:opacity-80` (with `aria-disabled:pointer-events-none`, as `disabled:` had);
  `inactiveClasses` keeps its `disabled:` classes for a button that is both.
- `src/components/ui/IconButton.tsx`: the same `loadingProps`, so a loading icon button keeps the
  focus too. Its only loading caller (`AIChatComposer`) also passes `disabled` while sending, so it
  behaves as before.
- `docs/ARCHITECTURE.md` 7.3: the `loading` rule.
- `tests/unit/foundation-kit.test.ts`: the attributes in each state, the cancelled click (and the
  caller's handler not called) for `Button` and `IconButton`, and the handler passed through once
  available.

Callers checked: every `loading=` caller is a client component (WS-A auth forms, WS-B enrol and
lesson controls, WS-C quiz submit, WS-D upload, submission, review and attachment buttons, WS-E
forms and dialogs, WS-I lab tools, WS-J certificate dialogs and settings forms). Each either
guards its handler with its own `pending` flag or relies on the button: both still hold, since
neither a click, Enter, Space nor Enter in a field reaches the form while loading. The
`focusWasLost` helpers of WS-B, WS-C, WS-D, WS-I and WS-J now find the focus where it was (not on
`body` or a `:disabled` control) and leave it there, as intended; WS-E's `settleAndRestoreFocus`
stays and does nothing in that case.

Checked in Chromium (the Auth emulator was down, so no signed-in page could be opened):

- `/fr/join` (public, a real server action held 1.5 s): Enter on the submit button keeps the
  focus on it for the whole request (`aria-disabled="true"`, `aria-busy="true"`, not disabled);
  Enter on it again and Enter in the code field during the request send no second action (one
  POST); then the next step takes the focus as before. At 375 and 1366 px.
- A harness page that mounts the real kit components with the app's compiled CSS: Enter and
  Space on a loading submit button, Enter in the form's field and a click send one submission;
  a loading `type="button"` does not run its `onClick` and keeps the focus; once available again
  the focus is still on the pressed button and both work; the loading look is opacity 0.8.
