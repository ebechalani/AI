# WS-E-3: `Dialog` inherits the text alignment of its trigger, and clips a long title

- **From:** WS-E (Teacher workspace; review fix round), 2026-10-16
- **Status:** open
- **Frozen files concerned:** `src/components/ui/Dialog.tsx`

## Problem

1. The native `<dialog>` stays in the DOM where its owner renders it (only its painting moves to
   the top layer), so it inherits `text-align` from there. A dialog whose trigger sits in a
   centred `EmptyState` has centred labels, hints and errors; one opened from an end-aligned
   table cell has an end-aligned title and text.
2. The title `<h2>` has no `break-words`, and the dialog has `overflow-hidden`: one long word in
   the title (a class or course name; 60 characters are allowed) is cut off at 375 px.

## Failing case (checked in Chromium, before the WS-E workaround)

- `/en/teacher` as a teacher without classes: "New class" in the onboarding empty state opens
  "Create a class" with `text-align: center` on the dialog and its labels.
- Grade 6 A (`teacher@demo`): "Remove" in a roster row opens a confirmation whose title and text
  are end-aligned (inherited from the `<td>`).
- A class named `Robotique’ExtraordinaireSupercalifragilistique2026`, 375 px: the titles of "Add
  students to …", "Show the code to …" and "Archive “…”?" are clipped at the dialog's edge.

## Wanted change

In `Dialog.tsx`, add `text-start` to the `<dialog>` class list and `break-words` to the title
`<h2>` (and the description `<p>`). Nothing else changes; a caller that wants another alignment
inside its body still sets it there.

## Workaround in place (WS-E)

`src/components/classes/dialog.ts` exports `DIALOG_TEXT = 'text-start break-words'`, passed as
`className` to every WS-E dialog (`ClassFormDialog`, `ConfirmDialog`, `AddStudentsForm`,
`CredentialsDialog`, `AssignCourseDialog`, `PresentCodeDialog`). It can stay once this lands.
Other workstreams' dialogs still inherit their trigger's alignment.
