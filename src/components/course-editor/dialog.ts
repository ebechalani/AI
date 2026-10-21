/**
 * Passed to every course-editor `Dialog`: a native `<dialog>` inherits the text alignment of
 * the place its owner renders it, and a long course or module title in its heading must wrap at
 * 375 px. Harmless now that the kit `Dialog` does both itself (WS-E-3).
 */
export const DIALOG_TEXT = 'text-start break-words';
