import { useCallback, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';

/**
 * Renders the error state now, then focuses the first invalid control inside `container`, or
 * `fallback` (the wrapper of a form-level `Alert`) when no field is marked invalid
 * (ARCHITECTURE.md 7.3).
 */
export function showErrorsAndFocus(
  update: () => void,
  container: HTMLElement | null,
  fallback?: () => HTMLElement | null,
): void {
  flushSync(update);
  const invalid = container?.querySelector<HTMLElement>('[aria-invalid="true"]');
  (invalid ?? fallback?.())?.focus();
}

/**
 * Ends a pending state now, then gives the focus to `target` if the pending state dropped it
 * (a natively disabled control sends the focus to `<body>`). Focus the user moved somewhere else
 * in the meantime stays where it is.
 */
export function settleAndRestoreFocus(
  settle: () => void,
  target: () => HTMLElement | null | undefined,
): void {
  flushSync(settle);
  const active = document.activeElement;
  if (active === null || active === document.body) target()?.focus();
}

/** The element focused now, to give the focus back to it once a request settles. */
export function focusedElement(): HTMLElement | null {
  const active = document.activeElement;
  return active instanceof HTMLElement && active !== document.body ? active : null;
}

/** `element` if it is still in the page, else `fallback`. */
export function stillThere(
  element: HTMLElement | null,
  fallback: HTMLElement | null,
): HTMLElement | null {
  return element?.isConnected ? element : fallback;
}

const PENDING_FOCUS_MS = 5_000;

/**
 * Focuses an element that does not exist yet, or cannot take the focus yet (a button disabled
 * while its list saves): for "focus the new module after the refresh". After every render the
 * owner's effect tries `document.getElementById(id)`; once the element holds the focus the
 * request is forgotten. It gives up after 5 s.
 */
export function usePendingFocus(): (id: string) => void {
  const pending = useRef<{ id: string; since: number } | null>(null);

  useEffect(() => {
    const request = pending.current;
    if (request === null) return;
    if (Date.now() - request.since > PENDING_FOCUS_MS) {
      pending.current = null;
      return;
    }
    const element = document.getElementById(request.id);
    if (element === null || element.matches(':disabled')) return;
    element.focus();
    if (document.activeElement === element) pending.current = null;
  });

  return useCallback((id: string) => {
    pending.current = { id, since: Date.now() };
  }, []);
}
