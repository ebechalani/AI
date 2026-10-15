import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  focusInView,
  focusWasLost,
  hasKeyboardFocus,
  revealOnFocus,
} from '@/components/lesson/focus';
import {
  LessonScrollPadding,
  PLAYER_SCROLL_PADDING,
} from '@/components/lesson/LessonScrollPadding';

// Keyboard focus in the lesson player (WS-B "player"): the scroll padding that keeps focused
// controls clear of LessonShell's sticky bars, and where focus goes when a control disables
// itself. The browser behaviour itself is checked in Chromium; these pin the rules down.

// Stopgap for foundation request WS-B-4: delete with LessonScrollPadding once it lands.
describe('LessonScrollPadding', () => {
  const rules = PLAYER_SCROLL_PADDING.split('}').filter((rule) => rule.includes('{'));

  it('renders the rules as a server-rendered <style>', () => {
    const element = LessonScrollPadding();
    expect(element.type).toBe('style');
    expect(element.props).toEqual({ children: PLAYER_SCROLL_PADDING });
  });

  it('pads the root only while focus is inside the lesson content', () => {
    // Padding while a sticky bar holds focus makes every Tab inside that bar scroll the page.
    expect(PLAYER_SCROLL_PADDING).not.toMatch(/(^|\})html\{/);
    const padding = rules.filter((rule) => rule.includes('scroll-padding'));
    expect(padding.length).toBeGreaterThan(0);
    for (const rule of padding) expect(rule).toContain('html:has(#main-content :focus){');
  });

  it('clears the top bar and, below xl, the footer with the floating tutor button', () => {
    // Top bar: at most 139 px (stepper on two rows); bottom stack: 153 px below xl, 93 px from xl.
    expect(PLAYER_SCROLL_PADDING).toContain(
      'html:has(#main-content :focus){scroll-padding-block:10rem 10.5rem}',
    );
    expect(PLAYER_SCROLL_PADDING).toContain(
      '@media (width>=80rem){html:has(#main-content :focus){scroll-padding-bottom:7rem}',
    );
  });

  it('offsets the jump targets by the same amount while focus is elsewhere', () => {
    expect(PLAYER_SCROLL_PADDING).toContain(
      'html:not(:has(#main-content :focus)) #main-content :is([id^="stage-"],[id^="block-"]){scroll-margin-top:10rem',
    );
  });
});

// --- Focus helpers -----------------------------------------------------------------------------

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
