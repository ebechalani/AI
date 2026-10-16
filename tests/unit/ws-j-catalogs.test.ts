import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { STAT_ITEMS, XP_REASONS } from '@/components/achievements/achievements-model';
import type { BackKey } from '@/components/certificates/certificate-model';
import {
  CONNECTIVITY,
  HARDWARE_KINDS,
  PROGRAMMING_MODES,
  ROBOTICS_THEMES,
} from '@/components/robotics/robotics-model';
import { AVATAR_IDS } from '@/lib/avatars';
import { HARDWARE_CAPABILITIES } from '@/types';

// The WS-J catalogs (ARCHITECTURE.md 10.5): typographic apostrophes, balanced ICU, the same keys
// in both locales, every message formattable, French no-break spaces written as the visible
// escape, and a message for every value the pages look up.

const MESSAGES_DIR = path.join(import.meta.dirname, '..', '..', 'src', 'messages');
const NAMESPACES = ['robotics', 'challenges', 'achievements', 'certificates', 'settings'] as const;

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

// Every argument and rich-text tag any message of the five namespaces takes.
const VALUES = {
  count: 2,
  xp: 500,
  date: '16 Oct 2026',
  name: 'AI Explorer',
  course: 'AI Robotics Foundations',
  courses: 'AI Robotics Foundations',
  types: 'Text or Link',
  max: 10,
  min: 2,
  earned: 2,
  total: 7,
  code: 'RH-ABCDEFGHJK',
  reason: 'Issued by mistake',
  school: 'Demo Academy',
  vendor: 'Any brand',
  weight: 40,
  language: 'English',
  // Rich-text tags (t.rich in the pages): plain strings are enough to format them here.
  lang: (chunks: string[]) => chunks.join(''),
};

// The raw JSON catalog is checked as data, so the app's typed `AppConfig` does not apply.
const translate = createTranslator as unknown as (config: {
  locale: string;
  messages: Record<string, unknown>;
  namespace: string;
  onError: (error: Error) => void;
}) => (key: string, values?: Record<string, unknown>) => string;

const CASES = ['en', 'fr'].flatMap((locale) =>
  NAMESPACES.map((namespace) => [locale, namespace] as const),
);

describe.each(CASES)('%s/%s catalog', (locale, namespace) => {
  const catalog: unknown = JSON.parse(rawCatalog(locale, namespace));
  const messages = leaves(catalog);

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
    const format = translate({
      locale,
      messages: { [namespace]: catalog },
      namespace,
      onError: (error) => errors.push(error.message),
    });
    for (const [key] of messages) {
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

describe.each(['en', 'fr'])('completeness of the %s catalogs', (locale) => {
  const has = (namespace: string, keys: readonly string[]) => {
    const present = new Set(leaves(JSON.parse(rawCatalog(locale, namespace))).map(([key]) => key));
    const missing = keys.filter((key) => !present.has(key));
    expect(missing, `${locale}/${namespace}`).toEqual([]);
  };

  it('has a message for every value the pages look up', () => {
    has('robotics', [
      ...HARDWARE_CAPABILITIES.map((capability) => `capabilities.${capability}`),
      ...HARDWARE_KINDS.map((kind) => `hardware.kinds.${kind}`),
      ...PROGRAMMING_MODES.map((mode) => `hardware.modes.${mode}`),
      ...CONNECTIVITY.map((link) => `hardware.links.${link}`),
      ...ROBOTICS_THEMES.flatMap((theme) => [
        `themes.${theme}.title`,
        `themes.${theme}.description`,
      ]),
    ]);
    has(
      'settings',
      AVATAR_IDS.map((id) => `avatars.${id}`),
    );
    has('achievements', [
      ...XP_REASONS.map((reason) => `history.reasons.${reason}`),
      ...STAT_ITEMS.map(({ key }) => `stats.${key}`),
    ]);
    const backKeys: BackKey[] = [
      'student',
      'teacherOwn',
      'teacher',
      'school_admin',
      'platform_admin',
    ];
    has(
      'certificates',
      backKeys.map((key) => `page.back.${key}`),
    );
    has(
      'challenges',
      (['open', 'upcoming', 'closed'] as const).map((phase) => `phases.${phase}.title`),
    );
  });
});

describe.each(['en', 'fr'])('plurals of the %s catalogs', (locale) => {
  const t = (namespace: string) =>
    translate({
      locale,
      messages: { [namespace]: JSON.parse(rawCatalog(locale, namespace)) as unknown },
      namespace,
      onError: (error) => {
        throw error;
      },
    });

  it('agrees the counts with their numbers', () => {
    const expected: Record<string, string[]> = {
      en: [
        'No course yet',
        '1 course',
        '3 courses',
        '1 attempt left',
        '9 attempts left',
        'You’re not in a class yet.',
        'You’re in 1 class.',
        'You’re in 2 classes.',
        '1 certificate',
        '2 certificates',
      ],
      fr: [
        'Aucun cours pour le moment',
        '1 cours',
        '3 cours',
        '1 tentative restante',
        '9 tentatives restantes',
        'Tu n’es encore dans aucune classe.',
        'Tu es dans 1 classe.',
        'Tu es dans 2 classes.',
        '1 certificat',
        '2 certificats',
      ],
    };
    expect([
      t('robotics')('themes.courseCount', { count: 0 }),
      t('robotics')('themes.courseCount', { count: 1 }),
      t('robotics')('themes.courseCount', { count: 3 }),
      t('challenges')('entry.returned.attemptsLeft', { count: 1 }),
      t('challenges')('entry.returned.attemptsLeft', { count: 9 }),
      t('settings')('classes.count', { count: 0 }),
      t('settings')('classes.count', { count: 1 }),
      t('settings')('classes.count', { count: 2 }),
      t('certificates')('list.count', { count: 1 }),
      t('certificates')('list.count', { count: 2 }),
    ]).toEqual(expected[locale]);
  });
});
