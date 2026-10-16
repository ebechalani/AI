import { useEffect, useRef, type RefObject } from 'react';

// Keyboard focus in the projects area (WS-D's own copies of the player's helpers, SPEC-D 11.3).
// Every loading Button is natively disabled, and a focused control that becomes disabled loses
// focus: each async control puts it back somewhere that stays (WCAG 2.4.3), fully in view
// (WCAG 2.4.11).

/** Whether `element` has focus the browser would show a ring for: reached by the keyboard. */
export function hasKeyboardFocus(element: Element | null): boolean {
  if (element === null) return false;
  try {
    return element.matches(':focus-visible');
  } catch {
    return false;
  }
}

/**
 * Whether keyboard focus is gone: on the page itself, on an element that left the page, or on a
 * control that is disabled now (inside `within` when given), which the browser is about to
 * leave.
 */
export function focusWasLost(within: Element | null): boolean {
  const active = document.activeElement;
  if (active === null || active === document.body || !active.isConnected) return true;
  return (within === null || within.contains(active)) && active.matches(':disabled');
}

/**
 * Moves focus to an element and makes it fully visible. `nearest` keeps the root's scroll
 * padding (the shells'), so the target never ends up under a sticky bar.
 */
export function focusInView(target: HTMLElement | null): void {
  if (target === null) return;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

/**
 * When `key` changes after the first render and focus was lost (the control that had it was
 * disabled, then unmounted by a refresh), focus moves to `ref`. Server-rendered sections cannot
 * hold refs, so the headings that take focus back are client components (RefocusHeading).
 */
export function useRefocusWhenLost(ref: RefObject<HTMLElement | null>, key: string): void {
  const previous = useRef(key);
  useEffect(() => {
    if (previous.current === key) return;
    previous.current = key;
    if (focusWasLost(null)) focusInView(ref.current);
  }, [key, ref]);
}

/**
 * A card radio draws its ring around the whole row, but on an arrow key the browser scrolls
 * only the small input into view, so the rest of the card can stay under a sticky footer.
 * Keyboard focus only, so a click never moves the page. For a container's `onFocus`.
 */
export function revealChoiceCard(event: { target: EventTarget }): void {
  const { target } = event;
  if (!(target instanceof HTMLInputElement) || target.type !== 'radio') return;
  if (!hasKeyboardFocus(target)) return;
  target.closest('label')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
