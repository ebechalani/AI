import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { suggestUsername } from '@/components/auth/username';
import { USERNAME_PATTERN } from '@/lib/limits';

// The pure helpers and catalogs of WS-A: the username proposed to a pupil, and the hygiene of
// the home, auth and legal catalogs (ICU apostrophes and balanced rich-text tags).

describe('suggestUsername', () => {
  it('builds the staff-style username from a display name', () => {
    expect(suggestUsername('Lea Demo')).toBe('lea.demo');
    expect(suggestUsername('  Omar   El-Khoury ')).toBe('omar.el.khoury');
  });

  it('drops accents and anything the schema refuses', () => {
    expect(suggestUsername('Éloïse Müller')).toBe('eloise.muller');
    expect(suggestUsername("O'Brien, Maya!")).toBe('o.brien.maya');
  });

  it('is empty when nothing usable is left, so the field is not prefilled with a bad value', () => {
    expect(suggestUsername('')).toBe('');
    expect(suggestUsername('李')).toBe('');
    expect(suggestUsername('A')).toBe('');
  });

  it('always satisfies USERNAME_PATTERN when not empty', () => {
    const names = ['Jean-Luc Picard', 'Zoë', 'A very long display name indeed yes', 'x.y_z-1'];
    for (const name of names) {
      const suggestion = suggestUsername(name);
      if (suggestion !== '') expect(suggestion).toMatch(USERNAME_PATTERN);
    }
    expect(suggestUsername('A very long display name indeed yes').length).toBeLessThanOrEqual(26);
  });
});

const MESSAGES_DIR = path.join(import.meta.dirname, '..', '..', 'src', 'messages');
const NAMESPACES = ['home', 'auth', 'legal'] as const;

function leaves(node: unknown, prefix = ''): [string, string][] {
  if (typeof node === 'string') return [[prefix, node]];
  if (typeof node !== 'object' || node === null) return [];
  return Object.entries(node).flatMap(([key, value]) =>
    leaves(value, prefix ? `${prefix}.${key}` : key),
  );
}

function catalog(locale: string, namespace: string): [string, string][] {
  const file = path.join(MESSAGES_DIR, locale, `${namespace}.json`);
  return leaves(JSON.parse(readFileSync(file, 'utf8')));
}

describe.each(['en', 'fr'])('WS-A catalogs (%s)', (locale) => {
  it.each(NAMESPACES)('%s uses typographic apostrophes and balanced tags', (namespace) => {
    for (const [key, value] of catalog(locale, namespace)) {
      expect(value, `${namespace}.${key}`).not.toMatch(/'/);
      expect(value, `${namespace}.${key}`).toMatch(/^[^{}]*(\{[^{}]*(\{[^{}]*\}[^{}]*)*\}[^{}]*)*$/);
      const opening = [...value.matchAll(/<(\w+)>/g)].map((m) => m[1]);
      const closing = [...value.matchAll(/<\/(\w+)>/g)].map((m) => m[1]);
      expect(opening.sort(), `${namespace}.${key}`).toEqual(closing.sort());
    }
  });

  it('writes French no-break spaces before double punctuation', () => {
    if (locale !== 'fr') return;
    for (const [key, value] of catalog(locale, 'auth')) {
      expect(value, `auth.${key}`).not.toMatch(/\S [?!:;]/);
    }
    for (const [key, value] of catalog(locale, 'home')) {
      expect(value, `home.${key}`).not.toMatch(/\S [?!:;]/);
    }
  });
});
