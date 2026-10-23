import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement, type ComponentProps, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { CheckboxFieldset, type CheckboxFieldsetProps } from '@/components/admin/CheckboxFieldset';
import { unbreakable } from '@/components/admin/dates';
import { LicensesTable } from '@/components/admin/LicensesTable';
import { isUnknownCountry } from '@/components/admin/school-model';
import { SchoolFields } from '@/components/admin/SchoolFields';
import { SchoolOverview } from '@/components/admin/SchoolOverview';
import type { License } from '@/types/billing';
import type { School } from '@/types/school';

// The fixes of the WS-H UX review: the country-code guard, the unbreakable dates of the billing
// tables, the singular seat counts, the agreement of the French on/off values and the local
// copy of the kit's field messages. What needs a browser (focus, table widths) was checked in
// Chromium.

vi.mock('@/lib/i18n/navigation', () => ({ Link: 'a' }));
// The Edit button opens a dialog with server actions; the table's own markup is under test.
vi.mock('@/components/admin/LicenseButton', () => ({ LicenseButton: () => null }));

const ROOT = path.join(import.meta.dirname, '..', '..');
const NB = String.fromCharCode(0xa0);

function catalog(locale: string, namespace: string): Record<string, unknown> {
  return JSON.parse(
    readFileSync(path.join(ROOT, 'src', 'messages', locale, `${namespace}.json`), 'utf8'),
  ) as Record<string, unknown>;
}

type ProviderProps = ComponentProps<typeof NextIntlClientProvider>;

function render(node: ReactNode, locale: 'en' | 'fr' = 'en'): string {
  const config: Omit<ProviderProps, 'children'> = {
    locale,
    messages: Object.fromEntries(
      ['admin', 'common', 'domain'].map((namespace) => [namespace, catalog(locale, namespace)]),
    ),
    timeZone: 'UTC',
  };
  return renderToStaticMarkup(createElement(NextIntlClientProvider, config as ProviderProps, node));
}

/** The text of the markup, entities decoded, tags removed. */
function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&#x27;', '’')
    .replaceAll('&nbsp;', NB)
    .replace(/[ \n]+/g, ' ')
    .trim();
}

const SCHOOL: School = {
  id: 's1',
  name: 'Demo Academy',
  country: 'LB',
  city: 'Beirut',
  defaultLocale: 'en',
  status: 'active',
  settings: { aiEnabled: true, aiDailyMessageLimit: null, joinCodesEnabled: true },
  counts: { teachers: 2, students: 3, classes: 1 },
  createdByUid: 'u1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('isUnknownCountry', () => {
  it('flags well-formed codes that name no country', () => {
    for (const code of ['LE', 'le', ' AA ', 'ZZ', 'zz']) expect(isUnknownCountry(code), code).toBe(true);
  });

  it('accepts assigned codes in any case', () => {
    for (const code of ['LB', 'lb', ' fr ', 'US', 'GB']) expect(isUnknownCountry(code), code).toBe(false);
  });

  it('leaves malformed values to the schema', () => {
    for (const code of ['', 'L', 'L1', 'Lebanon', 'LBN']) expect(isUnknownCountry(code), code).toBe(false);
  });
});

describe('unbreakable', () => {
  it('turns ordinary spaces into no-break spaces and keeps the rest', () => {
    expect(unbreakable('30 sept. 2027')).toBe(`30${NB}sept.${NB}2027`);
    expect(unbreakable('Oct 1, 2026')).toBe(`Oct${NB}1,${NB}2026`);
    const narrow = String.fromCharCode(0x202f);
    expect(unbreakable(`10${narrow}h`)).toBe(`10${narrow}h`);
  });
});

describe('SchoolFields country preview', () => {
  const values = { name: 'A school', country: '', city: '', defaultLocale: 'fr' as const };
  const fields = (country: string, locale: 'en' | 'fr') =>
    render(
      createElement(SchoolFields, {
        values: { ...values, country },
        onChange: () => {},
        errors: {},
        idPrefix: 'test',
      }),
      locale,
    );

  it('names a known country', () => {
    expect(text(fields('lb', 'fr'))).toContain(`Pays${NB}: Liban`);
    expect(text(fields('LB', 'en'))).toContain('Country: Lebanon');
  });

  it('warns about an unassigned code instead of echoing it', () => {
    const fr = text(fields('Le', 'fr'));
    expect(fr).toContain('LE n’est pas un code de pays. Vérifiez les deux lettres.');
    expect(fr).not.toContain(`Pays${NB}:`);
    expect(text(fields('LE', 'en'))).toContain('LE is not a country code. Check the two letters.');
  });

  it('says nothing while the code is incomplete', () => {
    expect(text(fields('L', 'en'))).not.toMatch(/Country: |not a country code/);
  });
});

describe('SchoolOverview on/off values', () => {
  const seats = { used: 3, total: 1, over: true, noLicense: false, percent: 100 };

  it('agrees in French with each fact', () => {
    const on = text(render(createElement(SchoolOverview, { school: SCHOOL, seats }), 'fr'));
    expect(on).toContain('Fonctions d’IA Activées');
    expect(on).toContain('Codes de classe Activés');
    const off = text(
      render(
        createElement(SchoolOverview, {
          school: { ...SCHOOL, settings: { ...SCHOOL.settings, aiEnabled: false, joinCodesEnabled: false } },
          seats,
        }),
        'fr',
      ),
    );
    expect(off).toContain('Fonctions d’IA Désactivées');
    expect(off).toContain('Codes de classe Désactivés');
  });

  it('writes a singular seat count in the over-limit alert', () => {
    expect(text(render(createElement(SchoolOverview, { school: SCHOOL, seats }), 'en'))).toContain(
      '3 active students for 1 seat.',
    );
    expect(text(render(createElement(SchoolOverview, { school: SCHOOL, seats }), 'fr'))).toContain(
      `3 élèves actifs pour 1${NB}place.`,
    );
  });
});

describe('LicensesTable seats and dates', () => {
  const license: License = {
    id: 'l1',
    schoolId: 's1',
    subscriptionId: null,
    name: 'One seat',
    seatsTotal: 1,
    scope: { type: 'all_official' },
    startsAt: '2026-10-01T00:00:00.000Z',
    endsAt: '2027-09-30T00:00:00.000Z',
    status: 'active',
    createdByUid: 'u1',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };
  const table = (locale: 'en' | 'fr', seatsTotal = 1) =>
    render(
      createElement(LicensesTable, {
        licenses: [{ ...license, seatsTotal }],
        schoolNames: { s1: 'Demo Academy' },
        pathwayTitles: {},
        showSchool: false,
        now: '2026-10-23T00:00:00.000Z',
        pathways: [],
        subscriptionOptions: null,
      }),
      locale,
    );

  it('keeps the seat count on one line, singular for one seat', () => {
    expect(table('en')).toMatch(/<td class="[^"]*whitespace-nowrap[^"]*">1 seat<\/td>/);
    expect(table('fr', 20)).toMatch(new RegExp(`<td class="[^"]*whitespace-nowrap[^"]*">20${NB}places</td>`));
  });

  it('lets the date range wrap only around its dash', () => {
    const html = table('fr');
    const cell = /<td class="([^"]*)">([^<]*–[^<]*)<\/td>/.exec(html);
    expect(cell?.[1]).toContain('whitespace-normal');
    const [start, end] = (cell?.[2] ?? '').split(' – ');
    expect(start).not.toMatch(/ /);
    expect(end).not.toMatch(/ /);
    expect(start).toContain('2026');
    expect(end).toContain('2027');
  });
});

describe('CheckboxFieldset', () => {
  it('binds its hint and error to the group as FormField does', () => {
    const html = render(
      createElement(
        CheckboxFieldset,
        { legend: 'Capabilities', hint: 'Pick any.', error: 'Pick one.' } as CheckboxFieldsetProps,
        createElement('input', { type: 'checkbox' }),
      ),
    );
    const describedBy = /<fieldset[^>]*aria-describedby="([^"]+)"/.exec(html)?.[1].split(' ') ?? [];
    expect(describedBy).toHaveLength(2);
    expect(html).toContain(`<p id="${describedBy[0]}" class="mt-1.5 text-sm text-ink-muted">Pick any.</p>`);
    expect(html).toMatch(new RegExp(`<p id="${describedBy[1]}" class="[^"]*text-danger[^"]*">.*Pick one\\.`));
  });

  it('describes nothing without a hint or an error', () => {
    const html = render(
      createElement(CheckboxFieldset, { legend: 'Capabilities' } as CheckboxFieldsetProps, null),
    );
    expect(html).not.toContain('aria-describedby');
  });
});
