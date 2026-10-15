'use client';

import { useEffect } from 'react';

// The shells pad the root while focus is inside `#main-content` (globals.css, ARCHITECTURE.md
// 7.5), and the browser scrolls a keyboard-focused element clear of that padding. For a text
// field it scrolls the caret line, not the field's box: Tab to a multi-line field whose first
// line is already on screen leaves the rest of the field where it is, partly under the bottom
// bar (the lesson footer and its floating tutor button, the student MobileNav). Measured on a
// 5-row field: 40 to 80 px of 160. The shells therefore scroll such a field wholly clear.

/**
 * After a multi-line field (a textarea, an editable region) inside the page content took focus:
 * scrolls it only as far as needed for its whole box to be clear of the root's scroll padding.
 * `nearest` keeps the padding and does nothing to a field that is already clear (a field taller
 * than the room between the bars gets one edge aligned); the browser then brings the caret line
 * into view as usual. Answers whether it scrolled.
 */
export function revealFocusedField(target: EventTarget | null): boolean {
  if (target === null || !('closest' in target) || !('scrollIntoView' in target)) return false;
  const field = target as HTMLElement;
  const multiLine = field.tagName === 'TEXTAREA' || field.isContentEditable === true;
  if (!multiLine || field.closest('#main-content') === null) return false;
  field.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  return true;
}

/** Schedules `callback` for a later task. */
export type Defer = (callback: () => void) => void;

const nextTask: Defer = (callback) => {
  window.setTimeout(callback, 0);
};

/**
 * Calls `revealFocusedField` for each focus on `doc` that a pointer press did not cause, until
 * the returned function is called. A press focuses its field in the same task as its
 * `pointerdown` or `mousedown`: scrolling then would move the text under a held button and turn
 * the click into a selection, and the learner sees what they pressed. Keyboard focus and focus
 * moved by a script are revealed. The listener runs before the browser's own focus scroll, so
 * that scroll (the caret line) has the last word.
 */
export function watchFieldFocus(
  doc: Pick<Document, 'addEventListener' | 'removeEventListener'>,
  defer: Defer = nextTask,
): () => void {
  let pressed = false;
  const onPress = () => {
    pressed = true;
    defer(() => {
      pressed = false;
    });
  };
  const onFocusIn = (event: Event) => {
    if (!pressed) revealFocusedField(event.target);
  };

  doc.addEventListener('pointerdown', onPress, true);
  doc.addEventListener('mousedown', onPress, true);
  doc.addEventListener('focusin', onFocusIn);
  return () => {
    doc.removeEventListener('pointerdown', onPress, true);
    doc.removeEventListener('mousedown', onPress, true);
    doc.removeEventListener('focusin', onFocusIn);
  };
}

/**
 * Rendered once by `AppShell` and `LessonShell`, next to their scroll padding: keeps a
 * keyboard-focused multi-line field in the page content wholly clear of the shell's bars
 * (`watchFieldFocus`). Renders nothing.
 */
export function FieldReveal(): null {
  useEffect(() => watchFieldFocus(document), []);
  return null;
}
