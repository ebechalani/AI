import { flushSync } from 'react-dom';

/** Every shell's `<main>` (ARCHITECTURE.md 7.5): a stable target when the page itself changes. */
export const MAIN_CONTENT_ID = 'main-content';

/**
 * Renders the error state now, then focuses the first invalid control inside `container`, or
 * `fallback` (the wrapper of a form-level `Alert`, which takes no ref of its own) when no field
 * is marked invalid (ARCHITECTURE.md 7.3).
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
 * Ends a pending state now (`settle` re-enables the controls), then gives the focus to
 * `target` if the pending state dropped it. The kit `Button` is natively disabled while
 * `loading`, and a focused control that becomes disabled sends the focus to `<body>`, so a
 * keyboard user would start again from the top of the page (ARCHITECTURE.md 7.3). Focus the
 * user moved somewhere else in the meantime stays where it is.
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
