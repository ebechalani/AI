import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import {
  ASSESSMENTS_PATH,
  assessmentsHref,
  attemptHref,
  firstParam,
  MAX_TRAIL,
  pageLinks,
  parsePaging,
  resolveClassId,
  resolveCourseId,
} from '@/components/quiz/assessments-model';

// WS-C: the filters and paging of /teacher/assessments (spec 5.2) and the hygiene of the
// `assessments` catalogs (ARCHITECTURE.md 10.5).

const ID = 'demo-omar_my-first-ai-adventure_quiz-m1_2';

function query(cursor: string | null, trail: string[] = []) {
  return { classId: 'class-1', courseId: null, cursor, trail };
}

/** The query of a locale-less href, as a plain object. */
function paramsOf(href: string | null): Record<string, string> {
  expect(href).not.toBeNull();
  const url = new URL(href!, 'http://localhost');
  expect(url.pathname).toBe(ASSESSMENTS_PATH);
  return Object.fromEntries(url.searchParams.entries());
}

describe('search parameters', () => {
  it('takes the first value of a repeated parameter', () => {
    expect(firstParam('a')).toBe('a');
    expect(firstParam(['b', 'c'])).toBe('b');
    expect(firstParam([])).toBeUndefined();
    expect(firstParam(undefined)).toBeUndefined();
  });

  it('resolves the class: the asked one, else the first active one, else the first', () => {
    const classes = [
      { id: 'old', archived: true },
      { id: 'a', archived: false },
      { id: 'b', archived: false },
    ];
    expect(resolveClassId('b', classes)).toBe('b');
    expect(resolveClassId('old', classes)).toBe('old');
    expect(resolveClassId('nope', classes)).toBe('a');
    expect(resolveClassId(undefined, classes)).toBe('a');
    expect(resolveClassId(undefined, [{ id: 'old', archived: true }])).toBe('old');
    expect(resolveClassId('x', [])).toBeNull();
  });

  it('resolves the course: an assigned one, anything else is "All courses"', () => {
    const assigned = ['c1', 'c2'];
    expect(resolveCourseId('c2', assigned)).toBe('c2');
    expect(resolveCourseId('', assigned)).toBeNull();
    expect(resolveCourseId('c3', assigned)).toBeNull();
    expect(resolveCourseId(undefined, assigned)).toBeNull();
  });
});

describe('parsePaging', () => {
  it('keeps a valid cursor and trail', () => {
    expect(parsePaging(ID, 'a_1.b-2')).toEqual({ cursor: ID, trail: ['a_1', 'b-2'] });
    expect(parsePaging(ID, undefined)).toEqual({ cursor: ID, trail: [] });
  });

  it('drops a malformed cursor and its trail', () => {
    expect(parsePaging('a/b', 'x')).toEqual({ cursor: null, trail: [] });
    expect(parsePaging('a.b', undefined)).toEqual({ cursor: null, trail: [] });
    expect(parsePaging('', 'x')).toEqual({ cursor: null, trail: [] });
  });

  it('drops a trail with a bad entry, too many entries, or without a cursor', () => {
    expect(parsePaging(ID, 'a..b')).toEqual({ cursor: ID, trail: [] });
    expect(parsePaging(ID, 'a.b/c')).toEqual({ cursor: ID, trail: [] });
    const full = Array.from({ length: MAX_TRAIL }, (_, index) => `p${index}`);
    expect(parsePaging(ID, full.join('.')).trail).toEqual(full);
    expect(parsePaging(ID, [...full, 'one-more'].join('.')).trail).toEqual([]);
    expect(parsePaging(undefined, 'a.b')).toEqual({ cursor: null, trail: [] });
  });
});

describe('hrefs', () => {
  it('builds the list href in a fixed order, leaving out empty parts', () => {
    expect(assessmentsHref({ classId: 'class-1', courseId: null })).toBe(
      '/teacher/assessments?classId=class-1',
    );
    expect(
      assessmentsHref({ classId: 'class-1', courseId: 'c-1', cursor: 'x_2', trail: ['a', 'b'] }),
    ).toBe('/teacher/assessments?classId=class-1&courseId=c-1&cursor=x_2&trail=a.b');
    expect(assessmentsHref({ classId: 'class-1', courseId: '', cursor: null, trail: ['a'] })).toBe(
      '/teacher/assessments?classId=class-1',
    );
  });

  it('encodes the values', () => {
    expect(assessmentsHref({ classId: 'a b&c', courseId: 'é' })).toBe(
      '/teacher/assessments?classId=a+b%26c&courseId=%C3%A9',
    );
  });

  it('links an attempt', () => {
    expect(attemptHref(ID)).toBe(`/teacher/assessments/${ID}`);
  });
});

describe('pageLinks', () => {
  it('page 1: no previous, next without a trail', () => {
    const links = pageLinks(query(null), 'c1');
    expect(links.page).toBe(1);
    expect(links.previousHref).toBeNull();
    expect(paramsOf(links.nextHref)).toEqual({ classId: 'class-1', cursor: 'c1' });
  });

  it('page 2: previous goes back to page 1 without a cursor', () => {
    const links = pageLinks(query('c1'), 'c2');
    expect(links.page).toBe(2);
    expect(paramsOf(links.previousHref)).toEqual({ classId: 'class-1' });
    expect(paramsOf(links.nextHref)).toEqual({ classId: 'class-1', cursor: 'c2', trail: 'c1' });
  });

  it('page 3: previous goes back to page 2 with its cursor and trail', () => {
    const links = pageLinks(query('c2', ['c1']), 'c3');
    expect(links.page).toBe(3);
    expect(paramsOf(links.previousHref)).toEqual({ classId: 'class-1', cursor: 'c1' });
    expect(paramsOf(links.nextHref)).toEqual({
      classId: 'class-1',
      cursor: 'c3',
      trail: 'c1.c2',
    });
  });

  it('the last page has no next link', () => {
    expect(pageLinks(query('c2', ['c1']), null).nextHref).toBeNull();
  });

  it('keeps the course filter on every link', () => {
    const links = pageLinks({ ...query('c1'), courseId: 'course-9' }, 'c2');
    expect(paramsOf(links.previousHref).courseId).toBe('course-9');
    expect(paramsOf(links.nextHref).courseId).toBe('course-9');
  });

  it('a full trail: no page number, and the next link keeps the last entries only', () => {
    const full = Array.from({ length: MAX_TRAIL }, (_, index) => `p${index}`);
    const links = pageLinks(query('cur', full), 'next');
    expect(links.page).toBeUndefined();
    const trail = paramsOf(links.nextHref).trail!.split('.');
    expect(trail).toHaveLength(MAX_TRAIL);
    expect(trail).toEqual([...full.slice(1), 'cur']);
    expect(pageLinks(query('cur', full.slice(1)), 'next').page).toBe(MAX_TRAIL + 1);
  });
});

// --- Catalog hygiene (10.5) ----------------------------------------------------------------

const MESSAGES_DIR = path.join(import.meta.dirname, '..', '..', 'src', 'messages');

function leaves(node: unknown, prefix = ''): [string, string][] {
  if (typeof node === 'string') return [[prefix, node]];
  if (typeof node !== 'object' || node === null) return [];
  return Object.entries(node).flatMap(([key, value]) =>
    leaves(value, prefix ? `${prefix}.${key}` : key),
  );
}

function balanced(value: string): boolean {
  let depth = 0;
  for (const char of value) {
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}

function rawCatalog(locale: string): string {
  return readFileSync(path.join(MESSAGES_DIR, locale, 'assessments.json'), 'utf8');
}

// Every argument any `assessments` message takes, so each message can be formatted.
const VALUES = {
  name: 'Omar Demo',
  className: 'Grade 6 A',
  course: 'My First AI Adventure',
  number: 2,
  score: 4,
  max: 6,
  percent: 66,
  quiz: 'Check: meet AI',
  time: '10:00',
  language: 'French',
};

type Translate = (key: string, values?: Record<string, string | number>) => string;

const translator = createTranslator as unknown as (config: {
  locale: string;
  messages: Record<string, unknown>;
  namespace: string;
  onError: (error: Error) => void;
}) => Translate;

describe.each(['en', 'fr'])('assessments catalog (%s)', (locale) => {
  const catalog: unknown = JSON.parse(rawCatalog(locale));
  const messages = leaves(catalog);

  it('uses typographic apostrophes and balanced braces', () => {
    for (const [key, value] of messages) {
      expect(value, key).not.toMatch(/'/);
      expect(balanced(value), key).toBe(true);
    }
  });

  it('has the same keys as the English source', () => {
    const source = leaves(JSON.parse(rawCatalog('en'))).map(([key]) => key);
    expect(messages.map(([key]) => key).sort()).toEqual(source.sort());
  });

  it('formats every message as ICU without an error', () => {
    const errors: string[] = [];
    const t = translator({
      locale,
      messages: { assessments: catalog },
      namespace: 'assessments',
      onError: (error) => errors.push(error.message),
    });
    for (const [key] of messages) {
      expect(t(key, VALUES), key).not.toBe(`assessments.${key}`);
    }
    expect(errors).toEqual([]);
  });

  it('agrees the points with their numbers and prints # literally outside a plural', () => {
    const t = translator({
      locale,
      messages: { assessments: catalog },
      namespace: 'assessments',
      onError: (error) => {
        throw error;
      },
    });
    const nb = String.fromCharCode(0xa0);
    const expected: Record<string, string[]> = {
      en: ['1 of 1 point', '4 of 6 points', '#2', '4/6 · 66%'],
      fr: ['1 sur 1 point', '4 sur 6 points', `n°${nb}2`, `4/6 · 66${nb}%`],
    };
    expect([
      t('detail.scoreHint', { score: 1, max: 1 }),
      t('detail.scoreHint', { score: 4, max: 6 }),
      t('list.attemptNumber', { number: 2 }),
      t('list.scoreValue', { score: 4, max: 6, percent: 66 }),
    ]).toEqual(expected[locale]);
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
