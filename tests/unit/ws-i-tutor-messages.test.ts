import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { TUTOR_REPLACE_KEY_LIST } from '@/components/ai/tutor-model';

// Catalog hygiene for the `tutor` namespace (SPEC-I 3.9, 3.10; ARCHITECTURE.md 10.5).

const MESSAGES_DIR = path.join(process.cwd(), 'src', 'messages');

function rawCatalog(locale: string): string {
  return readFileSync(path.join(MESSAGES_DIR, locale, 'tutor.json'), 'utf8');
}

function leaves(value: unknown, prefix = ''): [string, string][] {
  if (typeof value === 'string') return [[prefix, value]];
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) =>
    leaves(child, prefix ? `${prefix}.${key}` : key),
  );
}

// The raw JSON catalog is checked as data, so the app's typed `AppConfig` does not apply.
const translate = createTranslator as unknown as (config: {
  locale: string;
  messages: Record<string, unknown>;
  namespace: string;
  onError: (error: Error) => void;
}) => (key: string, values?: Record<string, string | number>) => string;

describe.each(['en', 'fr'])('tutor catalog (%s)', (locale) => {
  const catalog: unknown = JSON.parse(rawCatalog(locale));
  const messages = leaves(catalog);
  const keys = messages.map(([key]) => key);

  it('has the same keys as the English source', () => {
    const source = leaves(JSON.parse(rawCatalog('en'))).map(([key]) => key);
    expect([...keys].sort()).toEqual([...source].sort());
  });

  it('has the keys the UI and the stream name', () => {
    for (const key of [
      ...TUTOR_REPLACE_KEY_LIST,
      'limitReached',
      'slowDown',
      'cutShort',
      'modeChanged',
      'notAvailable',
      'sendFailed',
      'newChatStarted',
    ]) {
      expect(keys, key).toContain(key);
    }
  });

  it('uses typographic apostrophes and balanced braces', () => {
    for (const [key, value] of messages) {
      expect(value, key).not.toMatch(/'/);
      expect(value, key).toMatch(/^[^{}]*(\{[^{}]*(\{[^{}]*\}[^{}]*)*\}[^{}]*)*$/);
    }
  });

  it('formats every message as ICU without an error', () => {
    for (const values of [
      { seconds: 1, mode: 'Explain' },
      { seconds: 5, mode: 'Explain' },
    ]) {
      const errors: string[] = [];
      const t = translate({
        locale,
        messages: { tutor: catalog },
        namespace: 'tutor',
        onError: (error) => errors.push(error.message),
      });
      for (const key of keys) expect(t(key, values), key).not.toContain('tutor.');
      expect(errors).toEqual([]);
    }
  });

  it('puts the mode and the delay into their messages', () => {
    const t = translate({
      locale,
      messages: { tutor: catalog },
      namespace: 'tutor',
      onError: (error) => {
        throw error;
      },
    });
    expect(t('modeChanged', { mode: 'Hint' })).toContain('Hint');
    const [one, other] =
      locale === 'fr' ? ['1 seconde,', '12 secondes,'] : ['1 second,', '12 seconds,'];
    expect(t('slowDown', { seconds: 1 })).toContain(one);
    expect(t('slowDown', { seconds: 12 })).toContain(other);
  });

  it('writes French no-break spaces as the visible escape', () => {
    if (locale !== 'fr') return;
    for (const [key, value] of messages) {
      expect(value, key).not.toMatch(/\S [?!:;»%]/);
      expect(value, key).not.toMatch(/« /);
    }
    const raw = rawCatalog(locale);
    expect(raw.includes(String.fromCharCode(0xa0))).toBe(false);
    expect(raw).toContain('\\u00a0');
  });
});
