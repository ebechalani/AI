import { useCallback, useEffect, useRef } from 'react';

/**
 * Moves focus to a stable element once a dialog has closed, when the success that closed it
 * also removes the control that opened it (ARCHITECTURE.md 7.3: a refresh that deletes the
 * focused element drops focus to `<body>`).
 *
 * The success handler calls `focusLater(id)` before it closes the dialog. The `Dialog` is a
 * child of the owner and React runs child effects first, so the dialog's own `close()` (which
 * returns focus to its trigger) happens before this effect, and this effect wins.
 */
export function useFocusAfterClose(open: boolean): (id: string) => void {
  const pending = useRef<string | null>(null);

  useEffect(() => {
    if (open || pending.current === null) return;
    const id = pending.current;
    pending.current = null;
    document.getElementById(id)?.focus();
  }, [open]);

  return useCallback((id: string) => {
    pending.current = id;
  }, []);
}
