import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { MOCK_TOOL_OPTIONS, TEXT_EXAMPLE_KEYS } from '@/components/ai/lab-model';
import { labMessageKeys } from '@/lib/ai/lab';
import { LAB_TOOL_IDS, LAB_TOOLS, type LabToolStatus } from '@/lib/ai/lab-tools';

// Catalog hygiene for the `aiLab` namespace (SPEC-I 4.7, 4.8; ARCHITECTURE.md 8.5, 10.5).

const MESSAGES_DIR = path.join(process.cwd(), 'src', 'messages');
const STATUSES: LabToolStatus[] = ['live', 'mock', 'coming_soon'];

function rawCatalog(locale: string): string {
  return readFileSync(path.join(MESSAGES_DIR, locale, 'aiLab.json'), 'utf8');
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

describe.each(['en', 'fr'])('aiLab catalog (%s)', (locale) => {
  const catalog: unknown = JSON.parse(rawCatalog(locale));
  const messages = leaves(catalog);
  const keys = new Set(messages.map(([key]) => key));

  it('has the same keys as the English source', () => {
    const source = leaves(JSON.parse(rawCatalog('en'))).map(([key]) => key);
    expect([...keys].sort()).toEqual([...source].sort());
  });

  it('names every tool, status, choice and canned result the pages render', () => {
    const expected = [
      labMessageKeys.comingSoon,
      'comingSoonDescription',
      'unavailable',
      'limitReached',
      ...STATUSES.map((status) => `status.${status}`),
      ...LAB_TOOL_IDS.flatMap((id) => [`tools.${id}.title`, `tools.${id}.description`]),
      ...TEXT_EXAMPLE_KEYS.map((key) => `tools.text.examples.${key}`),
    ];
    for (const tool of LAB_TOOLS.filter((candidate) => candidate.status === 'mock')) {
      const options = Object.hasOwn(MOCK_TOOL_OPTIONS, tool.id)
        ? MOCK_TOOL_OPTIONS[tool.id as keyof typeof MOCK_TOOL_OPTIONS]
        : [];
      expect(options.length, tool.id).toBeGreaterThan(0);
      expected.push(
        labMessageKeys.mockResult(tool.id),
        `tools.${tool.id}.promptLabel`,
        `tools.${tool.id}.placeholder`,
        `tools.${tool.id}.optionLabel`,
        ...options.map((option) => `tools.${tool.id}.options.${option}`),
      );
    }
    for (const key of expected) expect(keys.has(key), key).toBe(true);
  });

  it('uses typographic apostrophes and balanced braces', () => {
    for (const [key, value] of messages) {
      expect(value, key).not.toMatch(/'/);
      expect(value, key).toMatch(/^[^{}]*(\{[^{}]*(\{[^{}]*\}[^{}]*)*\}[^{}]*)*$/);
    }
  });

  it('formats every message as ICU without an error', () => {
    const errors: string[] = [];
    const t = translate({
      locale,
      messages: { aiLab: catalog },
      namespace: 'aiLab',
      onError: (error) => errors.push(error.message),
    });
    for (const key of keys) expect(t(key, { count: 12, max: 2000 }), key).not.toContain('aiLab.');
    expect(errors).toEqual([]);
    expect(t('form.charCount', { count: 12, max: 2000 })).toMatch(/12 \/ 2[\s,.  ]?000/);
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
