import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';

// The `school` catalog (ARCHITECTURE.md 10.5): typographic apostrophes, balanced ICU, the same
// keys in both locales, every message formattable, plurals that agree with their numbers, French
// no-break spaces written as the visible escape, and every static key WS-G's code reads present
// in its namespace.

const ROOT = path.join(import.meta.dirname, '..', '..');
const MESSAGES_DIR = path.join(ROOT, 'src', 'messages');
const NAMESPACE = 'school';

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

function catalog(locale: string, namespace: string): unknown {
  return JSON.parse(rawCatalog(locale, namespace));
}

/** Braces balanced and at most three deep (a plural branch holding an argument). */
function balancedBraces(value: string): boolean {
  let depth = 0;
  for (const char of value) {
    if (char === '{') depth += 1;
    else if (char === '}') depth -= 1;
    if (depth < 0 || depth > 3) return false;
  }
  return depth === 0;
}

// Every argument any message of the namespace takes.
const VALUES = {
  count: 2,
  used: 5,
  total: 3,
  completed: 1,
  enrollments: 6,
  name: 'Lea',
  city: 'Beirut',
  date: '21 Sep 2027',
  days: 20,
  course: 'My First AI',
  email: 'a@b.test',
  reason: 'Too many attempts.',
  names: 'Nadia, Theo',
  className: 'Grade 6 A',
  max: 5,
  enrolled: 3,
  rate: '33%',
  lesson: 'What is AI?',
  min: 1,
  fallback: 60,
};

// The raw JSON catalog is checked as data, so the app's typed `AppConfig` does not apply.
const translate = createTranslator as unknown as (config: {
  locale: string;
  messages: Record<string, unknown>;
  namespace: string;
  onError: (error: Error) => void;
}) => (key: string, values?: Record<string, unknown>) => string;

function strict(locale: string) {
  return translate({
    locale,
    messages: { [NAMESPACE]: catalog(locale, NAMESPACE) },
    namespace: NAMESPACE,
    onError: (error) => {
      throw error;
    },
  });
}

describe.each(['en', 'fr'])('%s/school catalog', (locale) => {
  const messages = leaves(catalog(locale, NAMESPACE));

  it('uses typographic apostrophes and balanced braces', () => {
    for (const [key, value] of messages) {
      expect(value, key).not.toMatch(/'/);
      expect(balancedBraces(value), key).toBe(true);
    }
  });

  it('has no dot in a key name and the same keys as the English source', () => {
    const source = leaves(catalog('en', NAMESPACE)).map(([key]) => key);
    expect(messages.map(([key]) => key).sort()).toEqual(source.sort());
    expect(messages.length).toBeGreaterThan(300);
  });

  it('formats every message as ICU without an error', () => {
    const errors: string[] = [];
    const format = translate({
      locale,
      messages: { [NAMESPACE]: catalog(locale, NAMESPACE) },
      namespace: NAMESPACE,
      onError: (error) => errors.push(error.message),
    });
    for (const [key] of messages) {
      expect(format(key, VALUES), key).not.toBe(`${NAMESPACE}.${key}`);
      expect(format(key, VALUES), key).not.toMatch(/[{}]/);
    }
    expect(errors).toEqual([]);
  });

  it('writes French no-break spaces as the visible escape', () => {
    if (locale !== 'fr') return;
    for (const [key, value] of messages) {
      expect(value, key).not.toMatch(/\S [?!:;»%]/);
      expect(value, key).not.toMatch(/« /);
    }
    const raw = rawCatalog(locale, NAMESPACE);
    expect(raw.includes(String.fromCharCode(0xa0))).toBe(false);
    expect(raw).toContain('\\u00a0');
  });
});

describe('plurals agree with their numbers', () => {
  const NBSP = String.fromCharCode(0xa0);

  it('in English', () => {
    const t = strict('en');
    expect(
      [0, 1, 2].map((used) => t('alerts.overLimit', { used, total: 1 }).split('.')[0]),
    ).toEqual([
      '0 active students for 1 seat',
      '1 active student for 1 seat',
      '2 active students for 1 seat',
    ]);
    expect([0, 1, 2].map((total) => t('dashboard.seats.used', { used: 1, total }))).toEqual([
      '1 of 0 seats used',
      '1 of 1 seat used',
      '1 of 2 seats used',
    ]);
    expect([0, 1, 2].map((count) => t('classes.students', { count }))).toEqual([
      'No students',
      '1 student',
      '2 students',
    ]);
    expect([0, 1, 2].map((count) => t('class.roster.count', { count }))).toEqual([
      '0 students',
      '1 student',
      '2 students',
    ]);
    expect([0, 1, 2].map((count) => t('licenses.seatsCount', { count }))).toEqual([
      '0 seats',
      '1 seat',
      '2 seats',
    ]);
    expect([1, 2].map((max) => t('class.teachers.dialogDescription', { max }))).toEqual([
      'Choose up to 1 teacher. The owner always teaches the class.',
      'Choose up to 2 teachers. The owner always teaches the class.',
    ]);
  });

  it('in French (one covers 0 and 1, so the =0 branches stay explicit)', () => {
    const t = strict('fr');
    expect(
      [0, 1, 2].map((used) => t('alerts.overLimit', { used, total: 2 }).split('.')[0]),
    ).toEqual([
      '0 élève actif pour 2 places',
      '1 élève actif pour 2 places',
      '2 élèves actifs pour 2 places',
    ]);
    expect(t('alerts.overLimit', { used: 5, total: 3 })).toContain(`bloqué${NBSP}:`);
    expect([0, 1, 2].map((total) => t('dashboard.seats.used', { used: 1, total }))).toEqual([
      `Places utilisées${NBSP}: 1 sur 0`,
      `Places utilisées${NBSP}: 1 sur 1`,
      `Places utilisées${NBSP}: 1 sur 2`,
    ]);
    expect([0, 1, 2].map((count) => t('classes.students', { count }))).toEqual([
      'Aucun élève',
      '1 élève',
      '2 élèves',
    ]);
    expect([0, 1, 2].map((count) => t('class.roster.count', { count }))).toEqual([
      '0 élève',
      '1 élève',
      '2 élèves',
    ]);
    expect([0, 1, 2].map((count) => t('licenses.seatsCount', { count }))).toEqual([
      '0 place',
      '1 place',
      '2 places',
    ]);
    expect([1, 2].map((max) => t('class.teachers.dialogDescription', { max }))).toEqual([
      'Choisissez jusqu’à 1 enseignant. Le titulaire enseigne toujours dans la classe.',
      'Choisissez jusqu’à 2 enseignants. Le titulaire enseigne toujours dans la classe.',
    ]);
  });
});

describe('dynamic keys exist for every value the code passes', () => {
  // Keys built with template literals, which the usage test below skips:
  // class.roster.method.<joinMethod>, class.roster.empty.<rosterEmptyVariant>,
  // courses.visibility.<visibility> (only 'private' and 'school' have a chip).
  const has = (key: string) => leaves(catalog('en', NAMESPACE)).some(([candidate]) => candidate === key);

  it.each([
    ...['code', 'you', 'staff'].map((method) => `class.roster.method.${method}`),
    ...['both', 'addOnly', 'codeOnly', 'none', 'archived'].map(
      (variant) => `class.roster.empty.${variant}`,
    ),
    ...['private', 'school'].map((visibility) => `courses.visibility.${visibility}`),
  ])('school.%s', (key) => {
    expect(has(key)).toBe(true);
  });
});

// --- Usage: every static key the code reads exists --------------------------------------------

const SOURCE_DIRS = ['src/components/school', 'src/app/[locale]/school'];

function sourceFiles(): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry)) files.push(full);
    }
  };
  for (const dir of SOURCE_DIRS) walk(path.join(ROOT, dir));
  return files;
}

const BINDING = /const (t\w*) = (?:await )?(?:useTranslations|getTranslations)\('(\w+)'\)/g;

describe('every static message key WS-G reads exists in English', () => {
  const files = sourceFiles();
  const keySets = new Map<string, Set<string>>();
  const keysOf = (namespace: string) => {
    let keys = keySets.get(namespace);
    if (keys === undefined) {
      keys = new Set(leaves(catalog('en', namespace)).map(([key]) => key));
      keySets.set(namespace, keys);
    }
    return keys;
  };

  it('finds the source files', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it.each(files.map((file) => [path.relative(ROOT, file), file]))('%s', (_name, file) => {
    const text = readFileSync(file, 'utf8');
    const bindings = new Map<string, string>();
    for (const [, name, namespace] of text.matchAll(BINDING)) {
      const previous = bindings.get(name!);
      // One namespace per binding name in a file, so a key is checked against the right one.
      expect(previous === undefined || previous === namespace, `${name} rebound`).toBe(true);
      bindings.set(name!, namespace!);
    }
    const missing: string[] = [];
    for (const [name, namespace] of bindings) {
      const call = new RegExp(`\\b${name}(?:\\.rich|\\.has)?\\(\\s*'([^']+)'`, 'g');
      for (const [, key] of text.matchAll(call)) {
        if (!keysOf(namespace).has(key!)) missing.push(`${namespace}.${key}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
