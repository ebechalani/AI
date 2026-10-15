// Keyboard focus in the lesson player. A natively disabled button drops focus to the page, and
// the player puts it back somewhere that stays (WCAG 2.4.3); a focused field must be in view
// (WCAG 2.4.11) where the browser would leave it off-screen or under the top bar.

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
 * control inside `within` that is disabled now (the browser moves focus off it on its next
 * update).
 */
export function focusWasLost(within: Element | null): boolean {
  const active = document.activeElement;
  if (active === null || active === document.body || !active.isConnected) return true;
  return within !== null && within.contains(active) && active.matches(':disabled');
}

/**
 * Moves focus to a field and makes it fully visible: the browser leaves a partly visible field
 * where it is on focus, which can be under the sticky top bar. `nearest` keeps the root's scroll
 * padding (LessonScrollPadding) and does not scroll a field already in view.
 */
export function focusInView(field: HTMLElement): void {
  field.focus({ preventScroll: true });
  field.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

/**
 * `onFocus` of a read-only field (the preview): Chrome does not scroll an empty read-only
 * textarea into view when it gets focus, so it could take focus off-screen (WCAG 2.4.11).
 */
export function revealOnFocus(event: { currentTarget: HTMLElement }): void {
  event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
