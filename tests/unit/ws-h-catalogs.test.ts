import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { STATUS_FILTERS } from '@/components/admin/challenge-model';
import { PEOPLE_TABS, ROLE_TABS } from '@/components/admin/user-model';
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUSES } from '@/types/billing';
import { HARDWARE_CAPABILITIES } from '@/types/hardware';

// The `admin` catalog (ARCHITECTURE.md 10.5): typographic apostrophes, balanced ICU, the same
// keys in both locales, every message formattable, plurals that agree with their numbers, French
// no-break spaces written as the visible escape, every run-time key family complete, and every
// static key WS-H's code reads present in its namespace.

const ROOT = path.join(import.meta.dirname, '..', '..');
const MESSAGES_DIR = path.join(ROOT, 'src', 'messages');
const NAMESPACE = 'admin';

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

// Every argument any message of the namespace takes (SPEC-H 9.3).
const VALUES = {
  count: 2,
  max: 10,
  min: 2,
  name: 'Lea',
  school: 'Demo Academy',
  email: 'a@b.c',
  reason: 'Try later.',
  city: 'Beirut',
  country: 'Lebanon',
  role: 'Teacher',
  completed: 1,
  total: 4,
  used: 3,
  start: '1 Oct',
  end: '2 Oct',
  zone: 'Asia/Beirut',
  section: 'Schools',
  tab: 'licenses',
  plan: 'School',
  names: 'A, B',
  owner: 'Demo',
  course: 'AI',
  date: '1 Oct',
  code: 'RH-1',
  title: 'Poster',
  audience: 'Every student',
  phase: 'Open',
  criterion: 'Creativity',
  language: 'English',
  number: 2,
  score: 80,
};

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

describe.each(['en', 'fr'])('%s/admin catalog', (locale) => {
  const messages = leaves(catalog(locale, NAMESPACE));

  it('exists and holds about five hundred messages', () => {
    expect(messages.length).toBeGreaterThan(450);
  });

  it('uses typographic apostrophes and balanced braces', () => {
    for (const [key, value] of messages) {
      expect(value, key).not.toMatch(/'/);
      expect(value, key).toMatch(/^[^{}]*(\{[^{}]*(\{[^{}]*\}[^{}]*)*\}[^{}]*)*$/);
    }
  });

  it('has no dot in a key name and the same keys as the English source', () => {
    const source = leaves(catalog('en', NAMESPACE)).map(([key]) => key);
    expect(messages.map(([key]) => key).sort()).toEqual(source.sort());
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
  it('in English', () => {
    const t = strict('en');
    expect([0, 1, 2].map((count) => t('challenges.entriesLink', { count }))).toEqual([
      'No entries',
      '1 entry',
      '2 entries',
    ]);
    expect([1, 2].map((count) => t('users.role.effects.leaveClasses', { name: 'Lea', count }))).toEqual([
      'Lea leaves their class.',
      'Lea leaves their 2 classes.',
    ]);
    expect(t('billing.subscriptions.coversCourses', { count: 1, names: 'AI' })).toBe('1 course: AI');
    expect(t('billing.licenses.scopePathways', { count: 2, names: 'A, B' })).toBe('2 pathways: A, B');
    expect(t('billing.filter.school', { tab: 'licenses', name: 'X' })).toBe('Licenses of X.');
    expect(t('billing.filter.school', { tab: 'subscriptions', name: 'X' })).toBe('Subscriptions of X.');
  });

  it('in French (one covers 0 and 1, so the =0 branch stays explicit)', () => {
    const t = strict('fr');
    expect([0, 1, 2].map((count) => t('challenges.entriesLink', { count }))).toEqual([
      'Aucune participation',
      '1 participation',
      '2 participations',
    ]);
    expect([1, 2].map((count) => t('users.role.effects.leaveClasses', { name: 'Lea', count }))).toEqual([
      'Lea quitte sa classe.',
      'Lea quitte ses 2 classes.',
    ]);
    expect(t('billing.filter.school', { tab: 'licenses', name: 'X' })).toBe('Licences de X.');
  });
});

describe('run-time key families are complete', () => {
  const has = (locale: string, key: string) =>
    leaves(catalog(locale, NAMESPACE)).some(([candidate]) => candidate === key);

  const families = [
    ...['schools', 'users', 'subscriptions', 'courses', 'certificates', 'challenges'].flatMap(
      (section) => [`dashboard.manage.${section}.title`, `dashboard.manage.${section}.description`],
    ),
    ...PEOPLE_TABS.map((role) => `schools.detail.people.empty.${role}`),
    ...ROLE_TABS.map((role) => `users.empty.${role}`),
    ...['signOut', 'leaveClasses', 'loseVerification', 'fullAccess', 'schoolAdmin', 'leaveSchool', 'joinSchool'].map(
      (effect) => `users.role.effects.${effect}`,
    ),
    ...SUBSCRIPTION_PLANS.map((plan) => `billing.plans.${plan}`),
    ...SUBSCRIPTION_STATUSES.map((status) => `billing.subscriptionStatus.${status}`),
    ...['subscriptions', 'licenses'].map((tab) => `billing.tabs.${tab}`),
    ...STATUS_FILTERS.map((filter) => `challenges.filters.${filter}`),
    ...['publish', 'unpublish', 'archive', 'restore'].flatMap((transition) => [
      `challenges.transitions.${transition}`,
      `challenges.transitions.${transition}Label`,
    ]),
    ...['publish', 'unpublish', 'archive'].flatMap((transition) => [
      `challenges.transitions.${transition}Title`,
      `challenges.transitions.${transition}Description`,
      `challenges.transitions.${transition}Confirm`,
    ]),
    ...['published', 'unpublished', 'archived', 'restored'].map((done) => `challenges.transitions.${done}`),
    ...HARDWARE_CAPABILITIES.map((capability) => `challenges.form.capabilityNames.${capability}`),
    ...['title', 'description', 'submissionRequirements', 'prizes'].map((field) => `challenges.form.${field}`),
  ];

  it.each(families.flatMap((key) => [['en', key] as const, ['fr', key] as const]))('%s %s', (locale, key) => {
    expect(has(locale, key)).toBe(true);
  });
});

// --- Usage: every static key the code reads exists --------------------------------------------

const SOURCE_DIRS = ['src/components/admin', 'src/app/[locale]/admin'];

function sourceFiles(): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        // WS-F's course editor routes read their own namespace.
        if (entry !== 'courses') walk(full);
      } else if (/\.tsx?$/.test(entry)) {
        files.push(full);
      }
    }
  };
  for (const dir of SOURCE_DIRS) walk(path.join(ROOT, dir));
  return files;
}

const BINDING = /const (t\w*) = (?:await )?(?:useTranslations|getTranslations)\('(\w+)'\)/g;

describe('every static message key WS-H reads exists in English', () => {
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
