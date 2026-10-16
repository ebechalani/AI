import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { AVATAR_IDS } from '@/lib/avatars';

// The `classes`, `teacher` and `reports` catalogs (ARCHITECTURE.md 10.5): typographic
// apostrophes, balanced ICU, the same keys in both locales, every message formattable, plurals
// that agree with their numbers, French no-break spaces written as the visible escape, and every
// static key that WS-E's code reads present in its namespace.

const ROOT = path.join(import.meta.dirname, '..', '..');
const MESSAGES_DIR = path.join(ROOT, 'src', 'messages');
const NAMESPACES = ['classes', 'teacher', 'reports'] as const;

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

// Every argument any message of the three namespaces takes.
const VALUES = {
  count: 2,
  max: 10,
  name: 'Lea',
  className: 'Grade 6 A',
  code: 'RBHDEM23',
  date: '17 Oct 2026',
  url: 'https://x/en/join',
  line: 3,
  message: 'Too long',
  course: 'My First AI',
  completed: 1,
  total: 4,
  passed: 1,
  attempted: 2,
  value: '75%',
  approved: 1,
  pending: 1,
  number: 2,
  badge: 'Champion',
  quiz: 'Quiz 1',
  title: 'Basics',
};

// The raw JSON catalog is checked as data, so the app's typed `AppConfig` does not apply.
const translate = createTranslator as unknown as (config: {
  locale: string;
  messages: Record<string, unknown>;
  namespace: string;
  onError: (error: Error) => void;
}) => (key: string, values?: Record<string, unknown>) => string;

function strict(locale: string, namespace: string) {
  return translate({
    locale,
    messages: { [namespace]: catalog(locale, namespace) },
    namespace,
    onError: (error) => {
      throw error;
    },
  });
}

const CASES = ['en', 'fr'].flatMap((locale) =>
  NAMESPACES.map((namespace) => [locale, namespace] as const),
);

describe.each(CASES)('%s/%s catalog', (locale, namespace) => {
  const messages = leaves(catalog(locale, namespace));

  it('uses typographic apostrophes and balanced braces', () => {
    for (const [key, value] of messages) {
      expect(value, key).not.toMatch(/'/);
      expect(value, key).toMatch(/^[^{}]*(\{[^{}]*(\{[^{}]*\}[^{}]*)*\}[^{}]*)*$/);
    }
  });

  it('has no dot in a key name and the same keys as the English source', () => {
    const source = leaves(catalog('en', namespace)).map(([key]) => key);
    expect(messages.map(([key]) => key).sort()).toEqual(source.sort());
  });

  it('formats every message as ICU without an error', () => {
    const errors: string[] = [];
    const format = translate({
      locale,
      messages: { [namespace]: catalog(locale, namespace) },
      namespace,
      onError: (error) => errors.push(error.message),
    });
    for (const [key] of messages) {
      expect(format(key, VALUES), key).not.toBe(`${namespace}.${key}`);
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
    const raw = rawCatalog(locale, namespace);
    expect(raw.includes(String.fromCharCode(0xa0))).toBe(false);
    expect(raw).toContain('\\u00a0');
  });
});

describe('plurals agree with their numbers', () => {
  it('in English', () => {
    const classes = strict('en', 'classes');
    const teacher = strict('en', 'teacher');
    expect([0, 1, 2].map((count) => classes('card.students', { count }))).toEqual([
      'No students',
      '1 student',
      '2 students',
    ]);
    expect([0, 1, 2].map((count) => classes('addStudents.submit', { count }))).toEqual([
      'Create accounts',
      'Create 1 account',
      'Create 2 accounts',
    ]);
    expect([1, 2].map((max) => classes('addStudents.errors.tooMany', { max }))).toEqual([
      'This class has room for 1 more student.',
      'This class has room for 2 more students.',
    ]);
    expect(
      [1, 2].map((total) => classes('student.progress.lessons', { completed: 1, total })),
    ).toEqual(['1 of 1 lesson completed', '1 of 2 lessons completed']);
    expect([0, 1, 2].map((count) => teacher('dashboard.pending.count', { count }))).toEqual([
      'Nothing waiting',
      '1 project waiting',
      '2 projects waiting',
    ]);
  });

  it('in French (one covers 0 and 1, so the =0 branches stay explicit)', () => {
    const classes = strict('fr', 'classes');
    const teacher = strict('fr', 'teacher');
    const reports = strict('fr', 'reports');
    expect([0, 1, 2].map((count) => classes('card.students', { count }))).toEqual([
      'Aucun élève',
      '1 élève',
      '2 élèves',
    ]);
    expect([0, 1, 2].map((count) => classes('addStudents.submit', { count }))).toEqual([
      'Créer les comptes',
      'Créer 1 compte',
      'Créer 2 comptes',
    ]);
    expect([1, 2].map((count) => classes('credentials.title', { count }))).toEqual([
      '1 compte créé',
      '2 comptes créés',
    ]);
    expect(
      [1, 2].map((total) => classes('student.progress.lessons', { completed: 1, total })),
    ).toEqual(['1 sur 1 leçon terminée', '1 sur 2 leçons terminées']);
    expect([0, 1, 2].map((count) => teacher('dashboard.pending.count', { count }))).toEqual([
      'Rien en attente',
      '1 projet en attente',
      '2 projets en attente',
    ]);
    expect(
      [0, 2].map((approved) => reports('table.projectsValue', { approved, pending: 1 })),
    ).toEqual(['0 approuvé, 1 en attente', '2 approuvés, 1 en attente']);
  });
});

describe('dynamic keys exist for every value the code passes', () => {
  // Keys built with template literals, which the usage test below skips:
  // classes: joinCode.hint.{anyAge|thirteenPlus|existingOnly},
  //   addStudents.blocked.{educator_not_verified|school_inactive}.{title|description},
  //   roster.method.{code|you|staff},
  //   roster.empty.{description|descriptionCodeOnly|descriptionAddOnly|descriptionNone|
  //   descriptionArchived};
  // teacher: courses.mine.audience.{student|teacher}, settings.avatars.<AVATAR_IDS>,
  //   course.academyPanel.{start|continue|review}.
  const has = (namespace: string, key: string) =>
    leaves(catalog('en', namespace)).some(([candidate]) => candidate === key);

  it.each([
    ...['anyAge', 'thirteenPlus', 'existingOnly'].map((hint) => `joinCode.hint.${hint}`),
    ...['educator_not_verified', 'school_inactive'].flatMap((reason) => [
      `addStudents.blocked.${reason}.title`,
      `addStudents.blocked.${reason}.description`,
    ]),
    ...['code', 'you', 'staff'].map((method) => `roster.method.${method}`),
    ...[
      'description',
      'descriptionCodeOnly',
      'descriptionAddOnly',
      'descriptionNone',
      'descriptionArchived',
    ].map((variant) => `roster.empty.${variant}`),
  ])('classes.%s', (key) => {
    expect(has('classes', key)).toBe(true);
  });

  it.each([
    ...['student', 'teacher'].map((audience) => `courses.mine.audience.${audience}`),
    ...AVATAR_IDS.map((id) => `settings.avatars.${id}`),
    ...['start', 'continue', 'review'].map((kind) => `course.academyPanel.${kind}`),
    ...['catalog', 'academy', 'school', 'mine'].map((tab) => `courses.tabs.${tab}`),
  ])('teacher.%s', (key) => {
    expect(has('teacher', key)).toBe(true);
  });
});

// --- Usage: every static key the code reads exists --------------------------------------------

const SOURCE_DIRS = [
  'src/components/classes',
  'src/components/teacher',
  'src/app/[locale]/teacher/(shell)/classes',
  'src/app/[locale]/teacher/(shell)/courses',
  'src/app/[locale]/teacher/(shell)/reports',
  'src/app/[locale]/teacher/(shell)/settings',
  'src/app/[locale]/teacher/(player)',
];
const SOURCE_FILES = ['src/app/[locale]/teacher/(shell)/page.tsx'];

function sourceFiles(): string[] {
  const files = SOURCE_FILES.map((file) => path.join(ROOT, file));
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

describe('every static message key WS-E reads exists in English', () => {
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
    expect(files.length).toBeGreaterThan(40);
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
