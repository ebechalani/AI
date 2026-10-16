/**
 * Passed to every WS-E `Dialog`. A native `<dialog>` stays where its owner renders it, so it
 * inherits the text alignment of its trigger's place (a centred empty state, an end-aligned
 * table cell); and a long class or course name in its title must wrap at 375 px instead of
 * being clipped by the dialog's `overflow-hidden` (ARCHITECTURE.md 7.1). Both properties are
 * inherited by the title, the fields and the messages inside.
 */
export const DIALOG_TEXT = 'text-start break-words';
