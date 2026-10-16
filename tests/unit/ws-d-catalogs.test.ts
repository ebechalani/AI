import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';

// The `projects` and `review` catalogs (ARCHITECTURE.md 10.5): typographic apostrophes,
// balanced ICU, the same keys in both locales, every message formattable, plurals that agree
// with their numbers, and French no-break spaces written as the visible escape.

const MESSAGES_DIR = path.join(import.meta.dirname, '..', '..', 'src', 'messages');

function leaves(node: unknown, prefix = ''): [string, string][] {
  if (typeof node === 'string') return [[prefix, node]];
  if (typeof node !== 'object' || node === null) return [];
  return Object.entries(node).flatMap(([key, value]) =>
    leaves(value, prefix ? `${prefix}.${key}` : key),
  );
}

function rawCatalog(locale: string, namespace: string): string {
  return readFileSync(path.join(MESSAGES_DIR, locale, `${namespace}.json`), 'utf8');
}

// Every argument any message of the two namespaces takes.
const VALUES = {
  count: 2,
  max: 10,
  number: 2,
  name: 'page-1.png',
  type: 'PNG',
  size: '1 MB',
  types: 'PNG or JPG',
  score: 75,
  weight: 25,
  xp: 300,
  date: '15 Oct 2026',
  locale: 'fr',
  used: 1,
};

// The raw JSON catalog is checked as data, so the app's typed `AppConfig` does not apply.
const translate = createTranslator as unknown as (config: {
  locale: string;
  messages: Record<string, unknown>;
  namespace: string;
  onError: (error: Error) => void;
}) => (key: string, values: Record<string, unknown>) => string;

const CASES = ['en', 'fr'].flatMap((locale) =>
  ['projects', 'review'].map((namespace) => [locale, namespace] as const),
);

describe.each(CASES)('%s/%s catalog', (locale, namespace) => {
  const catalog: unknown = JSON.parse(rawCatalog(locale, namespace));
  const messages = leaves(catalog);
  const t = (onError: (error: Error) => void) =>
    translate({ locale, messages: { [namespace]: catalog }, namespace, onError });

  it('uses typographic apostrophes and balanced braces', () => {
    for (const [key, value] of messages) {
      expect(value, key).not.toMatch(/'/);
      expect(value, key).toMatch(/^[^{}]*(\{[^{}]*(\{[^{}]*\}[^{}]*)*\}[^{}]*)*$/);
    }
  });

  it('has the same keys as the English source', () => {
    const source = leaves(JSON.parse(rawCatalog('en', namespace))).map(([key]) => key);
    expect(messages.map(([key]) => key).sort()).toEqual(source.sort());
  });

  it('formats every message as ICU without an error', () => {
    const errors: string[] = [];
    const format = t((error) => errors.push(error.message));
    for (const [key] of messages) {
      // A missing key or a failed format comes back as its path.
      expect(format(key, VALUES), key).not.toBe(`${namespace}.${key}`);
    }
    expect(errors).toEqual([]);
  });

  it('writes French no-break spaces as the visible escape', () => {
    if (locale !== 'fr') return;
    for (const [key, value] of messages) {
      expect(value, key).not.toMatch(/\S [?!:;»%]/);
      expect(value, key).not.toMatch(/« /);
    }
    const raw = rawCatalog(locale, namespace);
    expect(raw.includes(String.fromCharCode(0xa0))).toBe(false);
    expect(raw).toContain('\\u00a0');
  });
});

describe.each(['en', 'fr'])('plurals of the projects catalog (%s)', (locale) => {
  const catalog: unknown = JSON.parse(rawCatalog(locale, 'projects'));
  const t = translate({
    locale,
    messages: { projects: catalog },
    namespace: 'projects',
    onError: (error) => {
      throw error;
    },
  });

  it('agrees the counts with their numbers', () => {
    const expected: Record<string, string[]> = {
      en: [
        '1 earlier attempt',
        '2 earlier attempts',
        'You can ask 1 more time.',
        'You can ask 2 more times.',
        'You can attach 1 file.',
        'You can attach up to 5 files.',
      ],
      fr: [
        '1 tentative précédente',
        '2 tentatives précédentes',
        'Vous pouvez redemander 1 fois.',
        'Vous pouvez redemander 2 fois.',
        'Vous pouvez joindre 1 fichier.',
        'Vous pouvez joindre jusqu’à 5 fichiers.',
      ],
    };
    expect([
      t('list.sections.earlier', { count: 1 }),
      t('list.sections.earlier', { count: 2 }),
      t('outcome.aiUnavailable.retriesLeft', { count: 1 }),
      t('outcome.aiUnavailable.retriesLeft', { count: 2 }),
      t('form.files.hint', { max: 1 }),
      t('form.files.hint', { max: 5 }),
    ]).toEqual(expected[locale]);
  });
});

describe('the language of the AI’s suggested feedback', () => {
  const format = (locale: string, aiLocale: string) =>
    translate({
      locale,
      messages: { review: JSON.parse(rawCatalog(locale, 'review')) as unknown },
      namespace: 'review',
      onError: (error) => {
        throw error;
      },
    })('ai.writtenFeedback', { locale: aiLocale });

  it('names the language in the sentence’s own case (French writes it in lower case)', () => {
    expect(format('en', 'fr')).toBe('Suggested feedback for the student (in French)');
    expect(format('en', 'en')).toBe('Suggested feedback for the student (in English)');
    expect(format('fr', 'en')).toBe('Retour suggéré pour l’élève (en anglais)');
    expect(format('fr', 'fr')).toBe('Retour suggéré pour l’élève (en français)');
  });
});
