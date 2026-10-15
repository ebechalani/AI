import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement, type ComponentProps, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator, NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { EmptyState } from '@/components/ui/EmptyState';

// Foundation fixes asked for by WS-B: the plural of the pathway and module progress (WS-B-5),
// a certificate code that is never split (WS-B-6), and an h1 on every not-found page.

const ROOT = path.join(import.meta.dirname, '..', '..');
const LOCALES = ['en', 'fr'] as const;

function catalog(locale: string, namespace: string): Record<string, unknown> {
  return JSON.parse(
    readFileSync(path.join(ROOT, 'src', 'messages', locale, `${namespace}.json`), 'utf8'),
  ) as Record<string, unknown>;
}

// The raw JSON catalog is checked as data, so the app's typed `AppConfig` does not apply.
interface Translate {
  (key: string, values?: Record<string, string | number>): string;
  rich(key: string, values: Record<string, unknown>): ReactNode;
}
const translator = createTranslator as unknown as (config: {
  locale: string;
  messages: Record<string, unknown>;
  namespace?: string;
  onError: (error: Error) => void;
}) => Translate;

function domain(locale: string): Translate {
  return translator({
    locale,
    messages: { domain: catalog(locale, 'domain') },
    namespace: 'domain',
    onError: (error) => {
      throw error;
    },
  });
}

describe('pathway and module progress (WS-B-5)', () => {
  const expected = {
    en: {
      pathway: ['0 of 1 course completed', '1 of 1 course completed', '2 of 3 courses completed'],
      module: ['0 of 1 lesson completed', '1 of 1 lesson completed', '2 of 3 lessons completed'],
    },
    fr: {
      pathway: ['0 cours terminé sur 1', '1 cours terminé sur 1', '2 cours terminés sur 3'],
      module: ['0 leçon terminée sur 1', '1 leçon terminée sur 1', '2 leçons terminées sur 3'],
    },
  };
  const cases: [number, number][] = [
    [0, 1],
    [1, 1],
    [2, 3],
  ];

  it.each(LOCALES)('agrees the count with its number (%s)', (locale) => {
    const t = domain(locale);
    expect(cases.map(([completed, total]) => t('pathway.progress', { completed, total }))).toEqual(
      expected[locale].pathway,
    );
    expect(
      cases.map(([completed, total]) => t('lessonNav.moduleProgress', { completed, total })),
    ).toEqual(expected[locale].module);
  });
});

describe('certificate verification code (WS-B-6)', () => {
  const code = 'RH-MY22GJSWAO';

  it.each(LOCALES)('keeps the code whole in a non-breaking span (%s)', (locale) => {
    const html = renderToStaticMarkup(
      createElement(
        'p',
        null,
        domain(locale).rich('certificate.code', {
          code,
          nowrap: (chunks: ReactNode) =>
            createElement('span', { className: 'whitespace-nowrap' }, chunks),
        }),
      ),
    );
    expect(html).toContain(`<span class="whitespace-nowrap">${code}</span>`);
    // Only the label is outside the span, so only the label can wrap.
    expect(html.replace(/<span[^>]*>[^<]*<\/span>/, '')).not.toContain(code);
  });

  it('renders the code through the rich message, without break-all', () => {
    const card = readFileSync(path.join(ROOT, 'src/components/domain/CertificateCard.tsx'), 'utf8');
    expect(card).toContain("t.rich('certificate.code'");
    expect(card).toContain('whitespace-nowrap');
    expect(card).not.toContain('break-all');
  });
});

type ProviderProps = ComponentProps<typeof NextIntlClientProvider>;

function renderEmptyState(props: Parameters<typeof EmptyState>[0]): string {
  const config: Omit<ProviderProps, 'children'> = {
    locale: 'en',
    messages: { errors: catalog('en', 'errors') },
    timeZone: 'UTC',
  };
  // The children go in createElement's third argument.
  return renderToStaticMarkup(
    createElement(
      NextIntlClientProvider,
      config as ProviderProps,
      createElement(EmptyState, props),
    ),
  );
}

describe('EmptyState titleAs', () => {
  it('keeps the title a paragraph by default', () => {
    const html = renderEmptyState({ title: 'Nothing yet' });
    expect(html).toContain('<p class="mt-4 text-base font-semibold text-ink">Nothing yet</p>');
    expect(html).not.toMatch(/<h\d/);
  });

  it('renders the title as the heading asked for, with the same look', () => {
    const html = renderEmptyState({ title: 'Page not found', titleAs: 'h1' });
    expect(html).toContain('<h1 class="mt-4 text-base font-semibold text-ink">Page not found</h1>');
  });

  it('uses the heading for the default title too', () => {
    const errors = catalog('en', 'errors') as { empty: { title: string } };
    expect(renderEmptyState({ titleAs: 'h2' })).toContain(`>${errors.empty.title}</h2>`);
  });
});

function notFoundPages(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return notFoundPages(full);
    return entry.name === 'not-found.tsx' ? [full] : [];
  });
}

describe('not-found pages', () => {
  const pages = notFoundPages(path.join(ROOT, 'src', 'app'));

  it('covers the global, locale, group and area pages', () => {
    expect(pages.length).toBeGreaterThanOrEqual(11);
  });

  it.each(pages.map((page) => [path.relative(ROOT, page), page]))('%s has an h1', (_, page) => {
    const source = readFileSync(page, 'utf8');
    const emptyStates = source.match(/<EmptyState\b/g)?.length ?? 0;
    if (emptyStates === 0) expect(source).toMatch(/<h1[\s>]/);
    else expect(source.match(/\btitleAs="h1"/g)?.length).toBe(emptyStates);
  });
});
