'use client';

import { useEffect, type RefObject } from 'react';

// LessonShell's sticky top bar and its bottom stack (the footer and, below `xl`, the floating
// "Ask Robo AI" button that rides on it) cover both ends of the viewport. The browser does not
// scroll a keyboard-focused control that is inside the viewport but under one of them (WCAG 2.2
// SC 2.4.11), nor offset a jump target, unless the root has scroll padding. The shell measures
// its bars into the custom properties below, on <html>, while it is mounted; the rules that use
// them, and their first-paint fallbacks, are in globals.css (ARCHITECTURE.md 7.5).

/** The custom properties LessonShell sets on `<html>`. */
export const LESSON_SCROLL_VARS = {
  /** Root `scroll-padding-top` while focus is inside the lesson content. */
  paddingTop: '--lesson-scroll-top',
  /** Root `scroll-padding-bottom` while focus is inside the lesson content. */
  paddingBottom: '--lesson-scroll-bottom',
  /** `scroll-margin-top` of the jump targets while focus is anywhere else. */
  jumpMargin: '--lesson-jump-top',
} as const;

/**
 * The focus ring (a 2 px outline 2 px off the element) and the top of a text field: on focus the
 * browser scrolls a field's caret line, not its box, clear of the padding, so the field's border
 * and inner padding (about 14 px) must fit in it too.
 */
export const FOCUS_CLEARANCE_PX = 24;
/** The room between the top bar and a jump target. */
export const JUMP_CLEARANCE_PX = 16;

export interface LessonBarHeights {
  top: number;
  bottom: number;
}

/** The values of the custom properties for bars of the given heights, in whole pixels. */
export function lessonScrollValues({ top, bottom }: LessonBarHeights): Record<string, string> {
  const px = (value: number) => `${Math.ceil(Math.max(0, value))}px`;
  return {
    [LESSON_SCROLL_VARS.paddingTop]: px(top + FOCUS_CLEARANCE_PX),
    [LESSON_SCROLL_VARS.paddingBottom]: px(bottom + FOCUS_CLEARANCE_PX),
    [LESSON_SCROLL_VARS.jumpMargin]: px(top + JUMP_CLEARANCE_PX),
  };
}

interface Box {
  top: number;
  bottom: number;
  height: number;
}

/**
 * The height the bottom stack covers: from the top of its highest visible part to its bottom.
 * The floating tutor button is positioned above the stack, so it is not in the stack's own box;
 * hidden (`xl:hidden`) it measures 0 and is left out.
 */
export function stackExtent(stack: Box, parts: Iterable<Box>): number {
  let top = stack.top;
  for (const part of parts) if (part.height > 0) top = Math.min(top, part.top);
  return Math.max(0, stack.bottom - top);
}

/** The part of `<html>`'s `style` the custom properties are written to. */
type StyleTarget = Pick<CSSStyleDeclaration, 'getPropertyValue' | 'setProperty' | 'removeProperty'>;

/**
 * Remembers the values `LESSON_SCROLL_VARS` have on `style` now. `set` writes new values;
 * `restore` puts the remembered ones back and removes those that had none.
 */
export function lessonScrollVars(style: StyleTarget): {
  set(values: Record<string, string>): void;
  restore(): void;
} {
  const previous = Object.values(LESSON_SCROLL_VARS).map(
    (name) => [name, style.getPropertyValue(name)] as const,
  );
  return {
    set(values) {
      for (const [name, value] of Object.entries(values)) style.setProperty(name, value);
    },
    restore() {
      for (const [name, value] of previous) {
        if (value === '') style.removeProperty(name);
        else style.setProperty(name, value);
      }
    },
  };
}

/**
 * Sets `LESSON_SCROLL_VARS` on `style` from the bars' heights now and again whenever the top
 * bar, the bottom stack or one of the stack's parts changes size (a stepper that wraps, the
 * footer's "n steps left" line, the floating button hidden from `xl`). The returned function
 * stops observing and restores the previous values.
 */
export function watchLessonBars(
  header: Element,
  stack: Element,
  style: StyleTarget,
  Observer: typeof ResizeObserver = ResizeObserver,
): () => void {
  const vars = lessonScrollVars(style);
  const measure = () => {
    const parts = Array.from(stack.children, (part) => part.getBoundingClientRect());
    vars.set(
      lessonScrollValues({
        top: header.getBoundingClientRect().height,
        bottom: stackExtent(stack.getBoundingClientRect(), parts),
      }),
    );
  };

  measure();
  const observer = new Observer(measure);
  for (const element of [header, stack, ...Array.from(stack.children)]) observer.observe(element);

  return () => {
    observer.disconnect();
    vars.restore();
  };
}

/**
 * Keeps `LESSON_SCROLL_VARS` on `<html>` in step with the bars' measured heights while the shell
 * is mounted (`watchLessonBars`). `parts` names the stack's parts (the button, the footer), so a
 * part that comes or goes is observed too.
 */
export function useLessonScrollPadding(
  headerRef: RefObject<HTMLElement | null>,
  stackRef: RefObject<HTMLElement | null>,
  parts: string,
): void {
  useEffect(() => {
    const header = headerRef.current;
    const stack = stackRef.current;
    if (header === null || stack === null) return;
    return watchLessonBars(header, stack, document.documentElement.style);
  }, [headerRef, stackRef, parts]);
}
