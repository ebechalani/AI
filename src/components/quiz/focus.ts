// Keyboard focus in the quiz runner (copied from the lesson player, which keeps its own): a
// natively disabled button drops focus to the page, and the runner puts it back somewhere that
// stays (WCAG 2.4.3); a focused heading or field must be fully in view (WCAG 2.4.11).

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
 * Moves focus to an element and makes it fully visible. `nearest` keeps the root's scroll
 * padding (LessonShell's), so the target never ends up under the sticky top bar or footer, and
 * an element already in view does not scroll.
 */
export function focusInView(target: HTMLElement): void {
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

/**
 * An answer card's focus ring is drawn around its whole row, but on Tab or an arrow key the
 * browser scrolls only the small radio or checkbox into view, so the rest of the card can stay
 * under the lesson's sticky footer or the floating tutor button. Scrolls the card (the input's
 * label) into view instead; keyboard focus only, so a click never moves the page.
 */
export function revealChoiceCard(target: EventTarget): void {
  if (!(target instanceof HTMLInputElement)) return;
  if (target.type !== 'radio' && target.type !== 'checkbox') return;
  if (!hasKeyboardFocus(target)) return;
  target.closest('label')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
