import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { CONFLICT_KEYS } from '@/components/course-editor/errors-model';
import { STATUS_ACTIONS, STATUS_EXPLANATIONS } from '@/components/course-editor/outline-model';
import { TRANSLATION_STATES } from '@/components/course-editor/translations';
import { LOCALES } from '@/lib/i18n/config';
import { LAB_TOOL_IDS } from '@/types/ai';
import { AUDIENCES } from '@/types/common';
import { BLOCK_TYPES, CODE_LANGUAGES, VIDEO_SOURCES } from '@/types/content';
import { HARDWARE_CAPABILITIES } from '@/types/hardware';
import { PROJECT_KINDS } from '@/types/project';
import { QUESTION_TYPES, REVEAL_ANSWERS } from '@/types/quiz';

// The `courseEditor` catalogs (ARCHITECTURE.md 10.5): typographic apostrophes, balanced ICU,
// the same keys in both locales, every message formattable, French no-break spaces written as
// the visible escape, and every key the editor builds dynamically present.

const ROOT = path.join(import.meta.dirname, '..', '..');
const MESSAGES_DIR = path.join(ROOT, 'src', 'messages');
const NAMESPACE = 'courseEditor';

function leaves(node: unknown, prefix = ''): [string, string][] {
  if (typeof node === 'string') return [[prefix, node]];
  if (typeof node !== 'object' || node === null) return [];
  return Object.entries(node).flatMap(([key, value]) => leaves(value, prefix ? `${prefix}.${key}` : key));
}

function rawCatalog(locale: string): string {
  return readFileSync(path.join(MESSAGES_DIR, locale, `${NAMESPACE}.json`), 'utf8');
}

function catalog(locale: string): unknown {
  return JSON.parse(rawCatalog(locale));
}

const VALUES = {
  count: 2, max: 10, min: 4, position: 2, title: 'Basics', course: 'My First AI', module: 'Module 1',
  lesson: 'Lesson 1', language: 'French', field: 'Title', date: '17 Oct 2026', modules: 2, lessons: 3,
  quizzes: 1, projects: 1, reflections: 1, blocks: 2, xp: 50, duration: '1 h', pathway: 'AI Explorer',
  platform: 'Robot', type: 'Text', name: 'Module 1', id: 'abc', hosts: 'a and b', total: 90,
  criterion: 'Creativity', chars: 200, visibility: 'school', audience: 'student',
};

const translate = createTranslator as unknown as (config: {
  locale: string;
  messages: Record<string, unknown>;
  namespace: string;
  onError: (error: Error) => void;
}) => (key: string, values?: Record<string, unknown>) => string;

describe.each(['en', 'fr'])('%s/courseEditor catalog', (locale) => {
  const messages = leaves(catalog(locale));

  it('uses typographic apostrophes and balanced braces', () => {
    for (const [key, value] of messages) {
      expect(value, key).not.toMatch(/'/);
      expect(value, key).toMatch(/^[^{}]*(\{[^{}]*(\{[^{}]*(\{[^{}]*\}[^{}]*)*\}[^{}]*)*\}[^{}]*)*$/);
    }
  });

  it('has no dot in a key name and the same keys as the English source', () => {
    const source = leaves(catalog('en')).map(([key]) => key);
    expect(messages.map(([key]) => key).sort()).toEqual(source.sort());
    expect(source).toHaveLength(496);
  });

  it('formats every message as ICU without an error', () => {
    const errors: string[] = [];
    const format = translate({
      locale,
      messages: { [NAMESPACE]: catalog(locale) },
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
    const raw = rawCatalog(locale);
    expect(raw.includes(String.fromCharCode(0xa0))).toBe(false);
    expect(raw).toContain('\\' + 'u00a0');
  });

  it('has every key the editor builds dynamically', () => {
    const keys = new Set(messages.map(([key]) => key));
    const expected = [
      ...BLOCK_TYPES.flatMap((t) => [`blocks.types.${t}.label`, `blocks.types.${t}.description`]),
      ...QUESTION_TYPES.map((t) => `quiz.types.${t}`),
      ...['multiple_choice', 'true_false', 'multiple_answer'].map((t) => `quiz.answersHint.${t}`),
      ...REVEAL_ANSWERS.flatMap((r) => [`quiz.revealOptions.${r}`, `quiz.revealOptions.${r}Description`]),
      ...LAB_TOOL_IDS.map((id) => `blocks.ai.labTools.${id}`),
      ...HARDWARE_CAPABILITIES.map((c) => `details.capabilities.${c}`),
      ...CODE_LANGUAGES.map((l) => `blocks.code.languages.${l}`),
      ...VIDEO_SOURCES.map((s) => `blocks.video.sources.${s}`),
      ...['wide', 'standard', 'square'].map((r) => `blocks.embed.ratios.${r}`),
      ...STATUS_ACTIONS.flatMap((a) => [`status.confirm.${a}.title`, `status.confirm.${a}.description`, `status.toast.${a}`]),
      ...STATUS_EXPLANATIONS.map((e) => `status.explanation.${e}`),
      'status.explanation.publishedOfficialNoPathway',
      ...CONFLICT_KEYS.map((k) => `conflicts.${k}`),
      ...TRANSLATION_STATES.map((s) => `language.state.${s}`),
      ...LOCALES.map((l) => `languageNames.${l}`),
      ...AUDIENCES.flatMap((a) => [`list.audience.${a}`, `fields.audienceOptions.${a}`, `fields.audienceOptions.${a}Description`]),
      ...PROJECT_KINDS.flatMap((k) => [`project.kinds.${k}`, `project.kinds.${k}Description`]),
      ...['free', 'premium'].flatMap((t) => [`fields.accessTierOptions.${t}`, `fields.accessTierOptions.${t}Description`, `adminList.tier.${t}`]),
      ...['private', 'school'].flatMap((v) => [`list.visibility.${v}`, `fields.visibilityOptions.${v}`, `fields.visibilityOptions.${v}Description`]),
    ];
    for (const key of expected) expect(keys.has(key), key).toBe(true);
  });
});
