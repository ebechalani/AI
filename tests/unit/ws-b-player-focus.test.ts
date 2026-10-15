import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  focusInView,
  focusWasLost,
  hasKeyboardFocus,
  revealOnFocus,
} from '@/components/lesson/focus';

// Keyboard focus in the lesson player (WS-B "player"): where focus goes when a control disables
// itself, and how a focused field is brought into view. The browser behaviour itself is checked
// in Chromium; these pin the rules down. LessonShell's scroll padding is foundation code
// (tests/unit/shell-scroll-padding.test.ts).

interface FakeElement {
  isConnected: boolean;
  matches: (selector: string) => boolean;
}

function element(states: string[] = [], isConnected = true): FakeElement {
  return { isConnected, matches: (selector) => states.includes(selector) };
}

function container(...children: FakeElement[]) {
  return { contains: (node: unknown) => children.includes(node as FakeElement) };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('hasKeyboardFocus', () => {
  it('is true only for an element that shows a focus ring', () => {
    expect(hasKeyboardFocus(element([':focus-visible']) as unknown as Element)).toBe(true);
    expect(hasKeyboardFocus(element() as unknown as Element)).toBe(false);
    expect(hasKeyboardFocus(null)).toBe(false);
  });

  it('is false where the browser does not know :focus-visible', () => {
    const old = {
      matches: () => {
        throw new SyntaxError('unknown pseudo-class');
      },
    };
    expect(hasKeyboardFocus(old as unknown as Element)).toBe(false);
  });
});

describe('focusWasLost', () => {
  const body = element();

  function focusOn(active: FakeElement | null) {
    vi.stubGlobal('document', { activeElement: active, body });
  }

  it('is true when focus is on the page itself or nowhere', () => {
    focusOn(body);
    expect(focusWasLost(null)).toBe(true);
    focusOn(null);
    expect(focusWasLost(null)).toBe(true);
  });

  it('is true when the focused element left the page (the button the chip replaced)', () => {
    focusOn(element([], false));
    expect(focusWasLost(null)).toBe(true);
  });

  it('is true for a disabled control inside the given container only', () => {
    const disabled = element([':disabled']);
    focusOn(disabled);
    expect(focusWasLost(container(disabled) as unknown as Element)).toBe(true);
    expect(focusWasLost(container() as unknown as Element)).toBe(false);
    expect(focusWasLost(null)).toBe(false);
  });

  it('is false while an enabled control has focus', () => {
    const button = element();
    focusOn(button);
    expect(focusWasLost(container(button) as unknown as Element)).toBe(false);
  });
});

describe('focusInView and revealOnFocus', () => {
  it('focuses without the browser’s scroll, then scrolls only as far as needed', () => {
    const calls: string[] = [];
    const field = {
      focus: (options: unknown) => calls.push(`focus ${JSON.stringify(options)}`),
      scrollIntoView: (options: unknown) => calls.push(`scroll ${JSON.stringify(options)}`),
    };
    focusInView(field as unknown as HTMLElement);
    expect(calls).toEqual([
      'focus {"preventScroll":true}',
      'scroll {"block":"nearest","inline":"nearest"}',
    ]);
  });

  it('scrolls a focused read-only field into view', () => {
    const scrollIntoView = vi.fn();
    revealOnFocus({ currentTarget: { scrollIntoView } as unknown as HTMLElement });
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
  });
});
