import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  createElement,
  isValidElement,
  type ComponentProps,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { StatCard } from '@/components/domain/StatCard';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { IconButton } from '@/components/ui/IconButton';
import { TableHeaderCell } from '@/components/ui/Table';
import { Tabs } from '@/components/ui/Tabs';

// The kit changes asked for by WS-E (WS-E-2 to WS-E-6). What needs a browser (focus, scrolling,
// the edge fade) was checked in Chromium; these cases pin the markup and the click guard.

// Button.tsx also holds LinkButton, whose i18n Link needs Next's router; no case renders it.
vi.mock('@/lib/i18n/navigation', () => ({ Link: 'a' }));

const ROOT = path.join(import.meta.dirname, '..', '..');

function catalog(locale: string, namespace: string): Record<string, unknown> {
  return JSON.parse(
    readFileSync(path.join(ROOT, 'src', 'messages', locale, `${namespace}.json`), 'utf8'),
  ) as Record<string, unknown>;
}

type ProviderProps = ComponentProps<typeof NextIntlClientProvider>;

function render(node: ReactNode, locale: 'en' | 'fr' = 'en'): string {
  const config: Omit<ProviderProps, 'children'> = {
    locale,
    messages: { common: catalog(locale, 'common') },
    timeZone: 'UTC',
  };
  return renderToStaticMarkup(createElement(NextIntlClientProvider, config as ProviderProps, node));
}

/** The `<button>` element a kit button function returns (both are plain functions, no hooks). */
function buttonElement(element: ReactElement): ReactElement<ComponentProps<'button'>> {
  expect(isValidElement(element)).toBe(true);
  return element as ReactElement<ComponentProps<'button'>>;
}

function fakeClick() {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as MouseEvent<HTMLButtonElement> & {
    preventDefault: ReturnType<typeof vi.fn>;
    stopPropagation: ReturnType<typeof vi.fn>;
  };
}

describe('Button and IconButton loading (WS-E-2)', () => {
  it('keeps a loading button focusable: aria-disabled and aria-busy, never native disabled', () => {
    const html = renderToStaticMarkup(
      createElement(Button, { type: 'submit', loading: true }, 'Save'),
    );
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toMatch(/\sdisabled=""/);
    expect(html).toContain('aria-disabled:opacity-80');
  });

  it('keeps disabled native, with or without loading', () => {
    const disabled = renderToStaticMarkup(createElement(Button, { disabled: true }, 'Save'));
    expect(disabled).toMatch(/\sdisabled=""/);
    expect(disabled).not.toContain('aria-disabled="');
    expect(disabled).not.toContain('aria-busy');
    expect(disabled).toContain('disabled:opacity-60');

    const both = renderToStaticMarkup(
      createElement(Button, { disabled: true, loading: true }, 'Save'),
    );
    expect(both).toMatch(/\sdisabled=""/);
    expect(both).toContain('aria-busy="true"');
    expect(both).not.toContain('aria-disabled="');
  });

  it('adds nothing to an available button', () => {
    const html = renderToStaticMarkup(createElement(Button, null, 'Save'));
    expect(html).not.toContain('disabled=');
    expect(html).not.toContain('aria-busy');
  });

  it("cancels a loading button's click (and so its form's submission), not the caller's handler", () => {
    const onClick = vi.fn();
    for (const component of [Button, IconButton] as const) {
      const props = { loading: true, onClick, 'aria-label': 'Send' };
      const element = buttonElement(component(props as never));
      const event = fakeClick();
      element.props.onClick?.(event);
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(event.stopPropagation).toHaveBeenCalledTimes(1);
      expect(element.props['aria-disabled']).toBe(true);
      expect(element.props.disabled).toBeUndefined();
    }
    expect(onClick).not.toHaveBeenCalled();
  });

  it("passes the caller's onClick through once the button is available", () => {
    const onClick = vi.fn();
    for (const component of [Button, IconButton] as const) {
      const element = buttonElement(component({ onClick, 'aria-label': 'Send' } as never));
      expect(element.props.onClick).toBe(onClick);
      expect(element.props['aria-disabled']).toBeUndefined();
    }
  });

  it('lets a caller still set its own aria-disabled on an available button', () => {
    const html = renderToStaticMarkup(createElement(Button, { 'aria-disabled': true }, 'Save'));
    expect(html).toContain('aria-disabled="true"');
  });
});

describe('Dialog alignment and long titles (WS-E-3)', () => {
  it('is start-aligned and lets the title and description break a long word', () => {
    const html = render(
      createElement(
        Dialog,
        {
          open: true,
          onClose: () => {},
          title: 'Archiver « Robotique’ExtraordinaireSupercalifragilistique2026 » ?',
          description: 'Une description',
        },
        createElement('p', null, 'Body'),
      ),
    );
    expect(html).toMatch(/<dialog[^>]*class="[^"]*\btext-start\b/);
    expect(html).toMatch(/<h2[^>]*class="[^"]*\bbreak-words\b[^"]*"/);
    expect(html).toMatch(/<p id="[^"]+" class="[^"]*\bbreak-words\b[^"]*"/);
  });
});

describe('TableHeaderCell wrap (WS-E-4)', () => {
  const cell = (props: ComponentProps<typeof TableHeaderCell>) =>
    renderToStaticMarkup(
      createElement(
        'table',
        null,
        createElement(
          'thead',
          null,
          createElement('tr', null, createElement(TableHeaderCell, props)),
        ),
      ),
    );

  it('keeps a header on one line by default', () => {
    const html = cell({ children: 'Moyenne aux quiz' });
    expect(html).toContain('whitespace-nowrap');
    expect(html).not.toContain('whitespace-normal');
  });

  it('lets a header wrap with `wrap`, without the conflicting nowrap', () => {
    for (const scope of ['col', 'row'] as const) {
      const html = cell({ children: 'Dernière activité', wrap: true, scope });
      expect(html).toContain('whitespace-normal');
      expect(html).not.toContain('whitespace-nowrap');
      expect(html).toContain(`scope="${scope}"`);
    }
  });
});

describe('Tabs overflow cue (WS-E-5)', () => {
  it('renders no cue on the server: it is measured in the browser', () => {
    const html = renderToStaticMarkup(
      createElement(Tabs, {
        'aria-label': 'Cours',
        defaultValue: 'mine',
        tabs: [
          { value: 'catalog', label: 'Catalogue', content: 'A' },
          { value: 'mine', label: 'Mes cours', content: 'B' },
        ],
      }),
    );
    expect(html).not.toContain('data-overflow-start');
    expect(html).not.toContain('data-overflow-end');
    expect(html).toMatch(/aria-selected="true"[^>]*>Mes cours</);
    // The fade is drawn only while an edge has tabs past it.
    expect(html).toContain('data-[overflow-start]:[mask-image:var(--tab-fade-mask)]');
    expect(html).toContain('data-[overflow-end]:[mask-image:var(--tab-fade-mask)]');
  });
});

describe('StatCard in a narrow column (WS-E-6)', () => {
  const card = (value: string | number, locale: 'en' | 'fr' = 'fr') =>
    render(
      createElement(StatCard, { label: 'Progression moyenne', value, icon: 'TrendingUp' }),
      locale,
    );

  it('lets the label break and hyphenate inside the card', () => {
    expect(card(3)).toMatch(
      /<p class="[^"]*\bbreak-words hyphens-auto\b[^"]*">Progression moyenne</,
    );
  });

  it('never breaks a number', () => {
    const html = card(1250);
    expect(html).toMatch(/<p class="[^"]*\bwhitespace-nowrap\b[^"]*">1 250</);
    expect(html).not.toMatch(/text-2xl[^"]*break-words/);
  });

  it('wraps a string value only between its words (no break-words, so "50 %" stays whole)', () => {
    const html = card('50 %');
    expect(html).toMatch(/<p class="text-2xl leading-tight font-bold text-ink tabular-nums">50 %</);
  });

  it('moves the text under the icon when the card is narrower than about 180 px', () => {
    const html = card(3);
    expect(html).toContain('flex flex-wrap items-start gap-x-4 gap-y-3');
    expect(html).toContain('min-w-0 flex-1 basis-20');
  });
});
