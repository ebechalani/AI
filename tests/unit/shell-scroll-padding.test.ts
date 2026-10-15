import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { revealFocusedField, watchFieldFocus } from '@/components/layout/field-reveal';
import {
  FOCUS_CLEARANCE_PX,
  JUMP_CLEARANCE_PX,
  LESSON_SCROLL_VARS,
  lessonScrollValues,
  lessonScrollVars,
  stackExtent,
  watchLessonBars,
} from '@/components/layout/lesson-scroll-padding';

// The shells' root scroll padding (ARCHITECTURE.md 7.5; foundation requests WS-B-3 and WS-B-4):
// a keyboard-focused element or a jump target is never left under a sticky or fixed bar (WCAG
// 2.2 SC 2.4.11). The browser behaviour itself is checked in Chromium; these pin the rules down.

const ROOT = path.join(import.meta.dirname, '..', '..');
const read = (file: string) => readFileSync(path.join(ROOT, file), 'utf8');

// The rules of globals.css with comments removed and whitespace collapsed.
const css = read('src/app/globals.css')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ');

// While a bar holds focus the root has no padding: the bars sit in the padded strips, so focusing
// a bar control from mid-page (Tab, a menu that opens or returns focus) would scroll the page.
const focusInContent = (shell: string) => `html:has(${shell} #main-content :focus)`;
const jumpTargets = (shell: string) =>
  `html:not(:has(${shell} #main-content :focus)) ${shell} :is(#main-content, #main-content [id])`;

describe('AppShell scroll padding (globals.css)', () => {
  it('clears the sticky TopBar at every width, for every role, while focus is in the content', () => {
    // The TopBar is min-h-16 (4rem) plus its border; 1.5rem more for the ring and a field's top.
    expect(css).toContain(`${focusInContent('[data-app-shell]')} { scroll-padding-top: 5.5rem; }`);
  });

  it('clears the student bottom bar below lg only, and no staff shell', () => {
    // The MobileNav is min-h-14 (3.5rem) plus its border and the safe area; it hides from lg.
    expect(css).toContain(
      `@media (width < 64rem) { ${focusInContent("[data-app-shell='student']")} { scroll-padding-bottom: calc(5.5rem + env(safe-area-inset-bottom)); } }`,
    );
  });

  it('offsets the content and its jump targets by the TopBar while focus is elsewhere', () => {
    expect(css).toContain(`${jumpTargets('[data-app-shell]')} { scroll-margin-top: 5rem; }`);
  });

  it('marks the shell root with the role and reveals multi-line fields', () => {
    const source = read('src/components/layout/AppShell.tsx');
    expect(source).toContain('data-app-shell={role}');
    expect(source).toContain('<FieldReveal />');
  });
});

describe('LessonShell scroll padding (globals.css)', () => {
  const shell = '[data-lesson-shell]';

  it('pads the root only while focus is inside the lesson content, with the measured bars', () => {
    expect(css).toContain(
      `${focusInContent(shell)} { scroll-padding-top: var(${LESSON_SCROLL_VARS.paddingTop}, 10rem); scroll-padding-bottom: var(${LESSON_SCROLL_VARS.paddingBottom}, 10.5rem); }`,
    );
    // Without the floating tutor button (from xl) the first-paint fallback is the footer alone.
    expect(css).toContain(
      `@media (width >= 80rem) { ${focusInContent(shell)} { scroll-padding-bottom: var(${LESSON_SCROLL_VARS.paddingBottom}, 7rem); } }`,
    );
  });

  it('offsets the jump targets (stages, blocks) by the top bar while focus is elsewhere', () => {
    expect(css).toContain(
      `${jumpTargets(shell)} { scroll-margin-top: var(${LESSON_SCROLL_VARS.jumpMargin}, 10rem); }`,
    );
  });

  it('marks the shell root, measures its bars and reveals multi-line fields', () => {
    const source = read('src/components/layout/LessonShell.tsx');
    expect(source).toContain('data-lesson-shell=""');
    expect(source).toContain('ref={headerRef}');
    expect(source).toContain('ref={bottomRef}');
    expect(source).toContain('<FieldReveal />');
    // The floating tutor button and the footer come and go: the hook observes them anew.
    expect(source).toContain(
      'useLessonScrollPadding(headerRef, bottomRef, `${hasTutor}:${Boolean(footer)}`);',
    );
    expect(read('src/components/layout/lesson-scroll-padding.ts')).toContain(
      '}, [headerRef, stackRef, parts]);',
    );
  });

  it('keeps 96 px of end room below xl for the floating tutor button, from sm up too', () => {
    // Regression: `max-xl:pb-24` next to `sm:py-8` lost to it from 640 to 1279 px (cn() does
    // not merge utilities, 7.1), so the end of the lesson kept 32 px and could not scroll
    // clear of the button.
    const source = read('src/components/layout/LessonShell.tsx');
    const main = source
      .slice(source.indexOf('<main'), source.indexOf('</main>'))
      .replace(/\/\/.*$/gm, '');
    expect(main).toContain("'flex-1 px-4 pt-6 outline-none sm:px-8 sm:pt-8'");
    expect(main).toContain("hasTutor ? 'pb-24 xl:pb-8' : 'pb-6 sm:pb-8'");
    const classes = Array.from(main.matchAll(/'([^']*)'/g), (match) => match[1]).join(' ');
    expect(classes.split(/\s+/).filter((name) => /(^|:)py-/.test(name))).toEqual([]);
  });
});

describe('root scroll padding and margins (globals.css)', () => {
  // Each part ends with the declarations of one rule and holds its selector.
  const rules = css.split('}').filter((rule) => /scroll-(padding|margin)/.test(rule));

  it('never pads the root while a bar holds focus, or outside a shell', () => {
    for (const rule of rules.filter((part) => part.includes('scroll-padding'))) {
      expect(rule).toMatch(
        /html:has\(\[data-(app|lesson)-shell(='student')?\] #main-content :focus\) \{/,
      );
    }
    expect(rules.filter((part) => part.includes('scroll-padding'))).toHaveLength(4);
  });

  it('gives margins only while focus is outside the content', () => {
    for (const rule of rules.filter((part) => part.includes('scroll-margin'))) {
      expect(rule).toMatch(/html:not\(:has\(\[data-(app|lesson)-shell\] #main-content :focus\)\)/);
    }
    expect(rules.filter((part) => part.includes('scroll-margin'))).toHaveLength(2);
  });
});

describe('lessonScrollValues', () => {
  it('adds the focus ring and some air to the bars, in whole pixels', () => {
    expect(lessonScrollValues({ top: 99, bottom: 153 })).toEqual({
      '--lesson-scroll-top': `${99 + FOCUS_CLEARANCE_PX}px`,
      '--lesson-scroll-bottom': `${153 + FOCUS_CLEARANCE_PX}px`,
      '--lesson-jump-top': `${99 + JUMP_CLEARANCE_PX}px`,
    });
    expect(lessonScrollValues({ top: 122.4, bottom: 92.6 })).toEqual({
      '--lesson-scroll-top': '147px',
      '--lesson-scroll-bottom': '117px',
      '--lesson-jump-top': '139px',
    });
  });

  it('clears the focus ring (4 px) and the top of a text field above its caret line (14 px)', () => {
    expect(FOCUS_CLEARANCE_PX).toBeGreaterThanOrEqual(4 + 14);
    // A jump target is scrolled by its own box.
    expect(JUMP_CLEARANCE_PX).toBeGreaterThan(4);
  });

  it('never answers a negative value', () => {
    expect(lessonScrollValues({ top: -50, bottom: -50 })).toEqual({
      '--lesson-scroll-top': '0px',
      '--lesson-scroll-bottom': '0px',
      '--lesson-jump-top': '0px',
    });
  });
});

describe('stackExtent', () => {
  // A footer stuck to the bottom of an 812 px viewport, 93 px tall.
  const footer = { top: 719, bottom: 812, height: 93 };

  it('counts the floating tutor button that rides above the footer', () => {
    const button = { top: 659, bottom: 703, height: 44 };
    expect(stackExtent(footer, [button, footer])).toBe(153);
  });

  it('leaves out a hidden part (the button from xl)', () => {
    const hidden = { top: 0, bottom: 0, height: 0 };
    expect(stackExtent(footer, [hidden, footer])).toBe(93);
  });

  it('is 0 for an empty stack', () => {
    expect(stackExtent({ top: 812, bottom: 812, height: 0 }, [])).toBe(0);
  });
});

describe('watchLessonBars', () => {
  // `style` of <html>: the custom properties as a map.
  function fakeStyle(initial: Record<string, string> = {}) {
    const values = new Map(Object.entries(initial));
    return {
      values,
      getPropertyValue: (name: string) => values.get(name) ?? '',
      setProperty: (name: string, value: string) => void values.set(name, value),
      removeProperty: (name: string) => {
        const old = values.get(name) ?? '';
        values.delete(name);
        return old;
      },
    };
  }

  function box(top: number, height: number) {
    return { getBoundingClientRect: () => ({ top, bottom: top + height, height }) };
  }

  // A 375 × 812 lesson: top bar 123 px, footer 93 px, floating tutor button 44 px above it.
  function bars() {
    const header = box(0, 123);
    const button = box(659, 44);
    const footer = box(719, 93);
    const stack = { ...box(719, 93), children: [button, footer] };
    return { header, button, footer, stack };
  }

  class FakeObserver {
    static last: FakeObserver | null = null;
    observed: unknown[] = [];
    disconnected = false;
    constructor(readonly callback: () => void) {
      FakeObserver.last = this;
    }
    observe(element: unknown) {
      this.observed.push(element);
    }
    disconnect() {
      this.disconnected = true;
    }
  }

  function watch(style: ReturnType<typeof fakeStyle>, parts = bars()) {
    const stop = watchLessonBars(
      parts.header as unknown as Element,
      parts.stack as unknown as Element,
      style as unknown as CSSStyleDeclaration,
      FakeObserver as unknown as typeof ResizeObserver,
    );
    return { stop, observer: FakeObserver.last!, parts };
  }

  it('sets the measured values at once and observes the bars and each part of the stack', () => {
    const style = fakeStyle();
    const { observer, parts } = watch(style);
    expect(Object.fromEntries(style.values)).toEqual(lessonScrollValues({ top: 123, bottom: 153 }));
    expect(observer.observed).toEqual([parts.header, parts.stack, parts.button, parts.footer]);
  });

  it('measures again when a bar changes size (a stepper that wraps)', () => {
    const style = fakeStyle();
    const { observer, parts } = watch(style);
    parts.header.getBoundingClientRect = () => ({ top: 0, bottom: 139, height: 139 });
    observer.callback();
    expect(style.values.get(LESSON_SCROLL_VARS.paddingTop)).toBe(`${139 + FOCUS_CLEARANCE_PX}px`);
    expect(style.values.get(LESSON_SCROLL_VARS.jumpMargin)).toBe(`${139 + JUMP_CLEARANCE_PX}px`);
  });

  it('stops observing and restores the previous values when the lesson is left', () => {
    const style = fakeStyle({ [LESSON_SCROLL_VARS.paddingTop]: '5px', color: 'red' });
    const { stop, observer } = watch(style);
    stop();
    expect(observer.disconnected).toBe(true);
    expect(Object.fromEntries(style.values)).toEqual({
      [LESSON_SCROLL_VARS.paddingTop]: '5px',
      color: 'red',
    });
  });

  it('lessonScrollVars writes only the given values and restores each one', () => {
    const style = fakeStyle({ [LESSON_SCROLL_VARS.jumpMargin]: '1px' });
    const vars = lessonScrollVars(style as unknown as CSSStyleDeclaration);
    vars.set({ [LESSON_SCROLL_VARS.jumpMargin]: '2px', [LESSON_SCROLL_VARS.paddingBottom]: '3px' });
    expect(style.values.get(LESSON_SCROLL_VARS.jumpMargin)).toBe('2px');
    vars.restore();
    expect(Object.fromEntries(style.values)).toEqual({ [LESSON_SCROLL_VARS.jumpMargin]: '1px' });
  });
});

describe('revealFocusedField', () => {
  // Chromium scrolls a focused text field's caret line clear of the root padding, not its box;
  // the shells scroll the rest of a multi-line field clear (field-reveal.ts).
  function field(tagName: string, { editable = false, inMain = true } = {}) {
    return {
      tagName,
      isContentEditable: editable,
      closest: (selector: string) => (selector === '#main-content' && inMain ? {} : null),
      scrollIntoView: vi.fn(),
    };
  }

  it('scrolls a textarea or an editable region in the page content only as far as needed', () => {
    for (const target of [field('TEXTAREA'), field('DIV', { editable: true })]) {
      expect(revealFocusedField(target as unknown as EventTarget)).toBe(true);
      expect(target.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
    }
  });

  it('leaves single-line fields and other controls to the browser', () => {
    for (const tagName of ['INPUT', 'SELECT', 'BUTTON', 'A', 'SECTION']) {
      const target = field(tagName);
      expect(revealFocusedField(target as unknown as EventTarget)).toBe(false);
      expect(target.scrollIntoView).not.toHaveBeenCalled();
    }
  });

  it('leaves a field outside the page content (a pane, a dialog), where the root is not padded', () => {
    const target = field('TEXTAREA', { inMain: false });
    expect(revealFocusedField(target as unknown as EventTarget)).toBe(false);
    expect(target.scrollIntoView).not.toHaveBeenCalled();
  });

  it('ignores a target that is not an element', () => {
    expect(revealFocusedField(null)).toBe(false);
    expect(revealFocusedField({} as EventTarget)).toBe(false);
  });
});

describe('watchFieldFocus', () => {
  function fakeDocument() {
    const listeners: { type: string; listener: (event: Event) => void; capture: boolean }[] = [];
    return {
      listeners,
      addEventListener(type: string, listener: (event: Event) => void, capture = false) {
        listeners.push({ type, listener, capture });
      },
      removeEventListener(type: string, listener: (event: Event) => void, capture = false) {
        const index = listeners.findIndex(
          (entry) =>
            entry.type === type && entry.listener === listener && entry.capture === capture,
        );
        if (index >= 0) listeners.splice(index, 1);
      },
      dispatch(type: string, target: unknown = null) {
        for (const entry of listeners.filter((item) => item.type === type))
          entry.listener({ type, target } as unknown as Event);
      },
    };
  }

  function textarea() {
    return {
      tagName: 'TEXTAREA',
      isContentEditable: false,
      closest: () => ({}),
      scrollIntoView: vi.fn(),
    };
  }

  function start() {
    const doc = fakeDocument();
    const deferred: (() => void)[] = [];
    const stop = watchFieldFocus(doc as unknown as Document, (callback) => deferred.push(callback));
    const nextTask = () => deferred.splice(0).forEach((callback) => callback());
    return { doc, stop, nextTask };
  }

  it('reveals a field reached by the keyboard or moved to by a script', () => {
    const { doc } = start();
    const target = textarea();
    doc.dispatch('focusin', target);
    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('leaves a field focused by a pointer press where it is, until the next task', () => {
    const { doc, nextTask } = start();
    // The press's own listeners run in the capture phase, before any page code can stop them.
    expect(doc.listeners.filter((entry) => entry.type !== 'focusin')).toEqual([
      expect.objectContaining({ type: 'pointerdown', capture: true }),
      expect.objectContaining({ type: 'mousedown', capture: true }),
    ]);
    for (const press of ['pointerdown', 'mousedown']) {
      const target = textarea();
      doc.dispatch(press);
      doc.dispatch('focusin', target);
      expect(target.scrollIntoView).not.toHaveBeenCalled();
      nextTask();
      doc.dispatch('focusin', target);
      expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
    }
  });

  it('removes its listeners when stopped', () => {
    const { doc, stop } = start();
    stop();
    expect(doc.listeners).toEqual([]);
  });
});
