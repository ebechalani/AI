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
  type Paging,
} from '@/components/quiz/assessments-model';

// WS-C: the filters and paging of /teacher/assessments (spec 5.2) and the hygiene of the
// `assessments` catalogs (ARCHITECTURE.md 10.5).

const ID = 'demo-omar_my-first-ai-adventure_quiz-m1_2';

function query(cursor: string | null, trail: string[] = [], page: number | null = null) {
  return { classId: 'class-1', courseId: null, cursor, trail, page };
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
  it('keeps a valid cursor, trail and page number', () => {
    expect(parsePaging(ID, 'a_1.b-2')).toEqual({ cursor: ID, trail: ['a_1', 'b-2'], page: null });
    expect(parsePaging(ID, undefined)).toEqual({ cursor: ID, trail: [], page: null });
    expect(parsePaging(ID, 'a_1', '24')).toEqual({ cursor: ID, trail: ['a_1'], page: 24 });
  });

  it('drops a malformed cursor and its trail and page number', () => {
    expect(parsePaging('a/b', 'x', '3')).toEqual({ cursor: null, trail: [], page: null });
    expect(parsePaging('a.b', undefined)).toEqual({ cursor: null, trail: [], page: null });
    expect(parsePaging('', 'x')).toEqual({ cursor: null, trail: [], page: null });
  });

  it('drops a trail with a bad entry, too many entries, or without a cursor', () => {
    expect(parsePaging(ID, 'a..b').trail).toEqual([]);
    expect(parsePaging(ID, 'a.b/c').trail).toEqual([]);
    const full = Array.from({ length: MAX_TRAIL }, (_, index) => `p${index}`);
    expect(parsePaging(ID, full.join('.')).trail).toEqual(full);
    expect(parsePaging(ID, [...full, 'one-more'].join('.')).trail).toEqual([]);
    expect(parsePaging(undefined, 'a.b', '2')).toEqual({ cursor: null, trail: [], page: null });
  });

  it('keeps a page number only when it is a positive integer of at most six digits', () => {
    for (const raw of ['0', '-2', '2.5', '1e3', ' 3', '03', 'x', '', '1234567']) {
      expect(parsePaging(ID, undefined, raw).page, raw).toBeNull();
    }
    expect(parsePaging(ID, undefined, '999999').page).toBe(999999);
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
    expect(
      assessmentsHref({ classId: 'class-1', courseId: null, cursor: 'x_2', trail: ['a'], page: 3 }),
    ).toBe('/teacher/assessments?classId=class-1&cursor=x_2&page=3&trail=a');
    // A page number means nothing without a cursor, and page 1 needs none.
    expect(assessmentsHref({ classId: 'class-1', courseId: null, cursor: null, page: 4 })).toBe(
      '/teacher/assessments?classId=class-1',
    );
    expect(assessmentsHref({ classId: 'class-1', courseId: null, cursor: 'x_2', page: 1 })).toBe(
      '/teacher/assessments?classId=class-1&cursor=x_2',
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
  it('page 1: no previous, next to page 2 without a trail', () => {
    const links = pageLinks(query(null), 'c1');
    expect(links.page).toBe(1);
    expect(links.previousHref).toBeNull();
    expect(paramsOf(links.nextHref)).toEqual({ classId: 'class-1', cursor: 'c1', page: '2' });
  });

  it('page 2: previous goes back to page 1 without a cursor', () => {
    const links = pageLinks(query('c1'), 'c2');
    expect(links.page).toBe(2);
    expect(paramsOf(links.previousHref)).toEqual({ classId: 'class-1' });
    expect(paramsOf(links.nextHref)).toEqual({
      classId: 'class-1',
      cursor: 'c2',
      page: '3',
      trail: 'c1',
    });
  });

  it('page 3: previous goes back to page 2 with its cursor and trail', () => {
    const links = pageLinks(query('c2', ['c1']), 'c3');
    expect(links.page).toBe(3);
    expect(paramsOf(links.previousHref)).toEqual({ classId: 'class-1', cursor: 'c1', page: '2' });
    expect(paramsOf(links.nextHref)).toEqual({
      classId: 'class-1',
      cursor: 'c3',
      page: '4',
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

  it('a full trail: the next link keeps the last entries only', () => {
    const full = Array.from({ length: MAX_TRAIL }, (_, index) => `p${index}`);
    const links = pageLinks(query('cur', full, 22), 'next');
    expect(links.page).toBe(22);
    const params = paramsOf(links.nextHref);
    expect(params.trail!.split('.')).toEqual([...full.slice(1), 'cur']);
    expect(params.page).toBe('23');
  });

  it('trusts a carried page number only when the trail allows it', () => {
    const full = Array.from({ length: MAX_TRAIL }, (_, index) => `p${index}`);
    // Without a carried number a full trail may have been cut: no label, no number on the links.
    const unknown = pageLinks(query('cur', full), 'next');
    expect(unknown.page).toBeUndefined();
    expect(paramsOf(unknown.nextHref).page).toBeUndefined();
    expect(paramsOf(unknown.previousHref).page).toBeUndefined();
    expect(pageLinks(query('cur', full.slice(1)), 'next').page).toBe(MAX_TRAIL + 1);
    // A number below what the trail proves is forged: the trail's count wins.
    expect(pageLinks(query('c2', ['c1'], 2), null).page).toBe(3);
    expect(pageLinks(query('cur', full, 5), null).page).toBeUndefined();
  });

  it('walks 25 pages forward and back with the right number on every page', () => {
    const cursorAfter = (page: number) => `demo-u_course_quiz_${page}`;
    const open = (href: string | null) => {
      const params = paramsOf(href);
      return parsePaging(params.cursor, params.trail, params.page);
    };
    /** The real page a query opens: the page after its cursor's page. */
    const realPage = (paging: Paging) =>
      paging.cursor === null ? 1 : Number(paging.cursor.split('_').at(-1)) + 1;

    let paging: Paging = parsePaging(undefined, undefined);
    const forward: (number | undefined)[] = [];
    for (let step = 0; step < 25; step += 1) {
      const links = pageLinks(
        { classId: 'class-1', courseId: null, ...paging },
        cursorAfter(step + 1),
      );
      expect(links.page).toBe(realPage(paging));
      forward.push(links.page);
      if (step < 24) paging = open(links.nextHref);
    }
    expect(forward).toEqual(Array.from({ length: 25 }, (_, index) => index + 1));
    expect(realPage(paging)).toBe(25);
    expect(paging.trail).toHaveLength(MAX_TRAIL);

    const backward: [number, number | undefined][] = [];
    for (;;) {
      const links = pageLinks({ classId: 'class-1', courseId: null, ...paging }, 'next_1');
      backward.push([realPage(paging), links.page]);
      if (links.previousHref === null) break;
      paging = open(links.previousHref);
    }
    // Every page shows its own number; the trail kept the cursors of pages 5 to 24, so Previous
    // on page 5 goes to page 1.
    expect(backward.every(([real, label]) => real === label)).toBe(true);
    expect(backward.map(([real]) => real)).toEqual([
      ...Array.from({ length: 21 }, (_, index) => 25 - index),
      1,
    ]);
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
      en: [
        '1 of 1 point',
        '4 of 6 points',
        '#2',
        '4/6 · 66%',
        'Omar Demo, attempt 2 at “Check: meet AI”',
        'Omar Demo: “Check: meet AI”',
      ],
      fr: [
        '1 sur 1 point',
        '4 sur 6 points',
        `n°${nb}2`,
        `4/6 · 66${nb}%`,
        `Omar Demo, tentative 2 au quiz «${nb}Check: meet AI${nb}»`,
        `Omar Demo${nb}: «${nb}Check: meet AI${nb}»`,
      ],
    };
    expect([
      t('detail.scoreHint', { score: 1, max: 1 }),
      t('detail.scoreHint', { score: 4, max: 6 }),
      t('list.attemptNumber', { number: 2 }),
      t('list.scoreValue', { score: 4, max: 6, percent: 66 }),
      // The row link's whole accessible name, starting with the visible name.
      t('list.rowLink', { name: 'Omar Demo', number: 2, quiz: 'Check: meet AI' }),
      // Seeded quiz titles hold a colon of their own, so the heading quotes the title.
      t('detail.title', { name: 'Omar Demo', quiz: 'Check: meet AI' }),
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
