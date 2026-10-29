import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement, type ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { MlActivityData } from '@/components/course-editor/block-forms/MlActivityFields';
import { newBlockDraft } from '@/components/course-editor/block-model';
import { MlActivityBlock } from '@/components/lesson/blocks/MlActivityBlock';
import type { LessonRuntime } from '@/components/lesson/blocks/registry';
import { visibleBlocks } from '@/components/lesson/lesson-model';
import {
  ML_ACTIVITY_HOSTS,
  ML_WORKSHEET_PREFIXES,
  isFrenchWorksheet,
  toMlActivityHref,
  toMlWorksheetHref,
} from '@/lib/learning/ml-activity';
import {
  ML_ACTIVITY_HOSTS as DECLARED_ML_ACTIVITY_HOSTS,
  ML_WORKSHEET_PREFIXES as DECLARED_ML_WORKSHEET_PREFIXES,
} from '@/lib/limits';
import { isMlActivityUrl, isMlWorksheetUrl } from '@/lib/schemas/course';
import {
  ML_ACCESS_MODES,
  ML_CODE_TOOLS,
  ML_PROJECT_TYPES,
  type BlockDataMap,
  type BlockTextMap,
  type LessonBlockOf,
} from '@/types/content';
import { SEED_COURSES } from '../../scripts/seed/content';

// The ml_activity block (ARCHITECTURE.md 7.6): the player's link checks agree with the rules the
// editor validates with, the site's language goes before its hash route, and the block links out
// in a new tab, with no button when its stored link fails the check. Its fixed French copy names
// the site's buttons as the French site does and says vous, since teachers read it too.

vi.mock('@/lib/i18n/navigation', () => ({ Link: 'a' }));

const SITE = 'https://machinelearningforkids.co.uk';
const WORKSHEETS = 'https://github.com/IBM/taxinomitis-docs/raw/master/project-worksheets/pdf/';

describe('the lists', () => {
  it('re-exports the lists of limits.ts', () => {
    expect(ML_ACTIVITY_HOSTS).toBe(DECLARED_ML_ACTIVITY_HOSTS);
    expect(ML_WORKSHEET_PREFIXES).toBe(DECLARED_ML_WORKSHEET_PREFIXES);
  });
});

describe('toMlActivityHref', () => {
  const urls = [
    `${SITE}/`,
    `${SITE}/#!/login`,
    `${SITE}/?utm=x#!/pretrained`,
    `${SITE}/?lang=ar#!/worksheets`,
    'HTTPS://MachineLearningForKids.co.uk/#!/login',
    `${SITE}:443/#!/login`,
    'http://machinelearningforkids.co.uk/#!/login',
    'https://machinelearningforkids.co.uk.evil.com/#!/login',
    'https://evil.com/machinelearningforkids.co.uk',
    'https://www.machinelearningforkids.co.uk/',
    `${SITE}:8443/`,
    'https://user:pw@machinelearningforkids.co.uk/',
    'https://user@machinelearningforkids.co.uk/',
    'javascript:alert(1)',
    'machinelearningforkids.co.uk',
    'not a url',
    '',
  ];

  it('opens only an https URL on the site itself, with no port and no credentials', () => {
    expect(urls.filter((url) => toMlActivityHref(url, 'en') !== null)).toEqual(urls.slice(0, 6));
  });

  it('agrees with the rule the course editor validates with', () => {
    for (const url of urls) {
      expect(toMlActivityHref(url, 'en') !== null, url).toBe(isMlActivityUrl(url));
    }
  });

  it('sets the language in the query, before the hash route', () => {
    expect(toMlActivityHref(`${SITE}/#!/login`, 'fr')).toBe(`${SITE}/?lang=fr#!/login`);
    expect(toMlActivityHref(SITE, 'en')).toBe(`${SITE}/?lang=en`);
    expect(toMlActivityHref(`${SITE}/?utm=x#!/login`, 'fr')).toBe(`${SITE}/?utm=x&lang=fr#!/login`);
    // The site reads document.location.search only, so a lang inside the hash does not count.
    expect(toMlActivityHref(`${SITE}/#!/login?lang=en`, 'fr')).toBe(
      `${SITE}/?lang=fr#!/login?lang=en`,
    );
  });

  it('never overrides a language the author set', () => {
    expect(toMlActivityHref(`${SITE}/?lang=en#!/login`, 'fr')).toBe(`${SITE}/?lang=en#!/login`);
    expect(toMlActivityHref(`${SITE}/?a=1&lang=ar`, 'fr')).toBe(`${SITE}/?a=1&lang=ar`);
  });

  it('cannot add a parameter through the locale', () => {
    expect(toMlActivityHref(`${SITE}/`, 'fr&x=1')).toBe(`${SITE}/?lang=fr%26x%3D1`);
  });
});

describe('toMlWorksheetHref', () => {
  const urls = [
    `${WORKSHEETS}worksheet-smartclassroom-tryitnow.pdf`,
    'https://raw.githubusercontent.com/IBM/taxinomitis-docs/master/project-worksheets/pdf/worksheet-fooled.pdf',
    'https://github.com/IBM/taxinomitis-docs/raw/master/teachers-notes/pdf/teachersnotes-smartclassroom-fr.pdf',
    `${WORKSHEETS}WORKSHEET-FOOLED.PDF`,
    // GitHub serves pull-request heads and commits of forks under the repository's own path.
    'https://raw.githubusercontent.com/IBM/taxinomitis-docs/refs/pull/13/head/project-worksheets/pdf/x.pdf',
    'https://github.com/IBM/taxinomitis-docs/raw/refs/pull/13/head/project-worksheets/pdf/x.pdf',
    'https://github.com/IBM/taxinomitis-docs/raw/0123456789abcdef0123456789abcdef01234567/x.pdf',
    'https://github.com/IBM/taxinomitis-docs/raw/master/x.pdf',
    'https://github.com/IBM/taxinomitis-docs/raw/master/docs/pdf/x.pdf',
    `${WORKSHEETS}sub/x.pdf`,
    `${WORKSHEETS}..%2f..%2fx.pdf`,
    `${WORKSHEETS}.pdf`,
    'https://github.com/IBM/taxinomitis-docs/blob/master/project-worksheets/pdf/worksheet-fooled.pdf',
    'https://github.com/IBM/taxinomitis/raw/master/x.pdf',
    'https://github.com/IBM/taxinomitis-docs-copy/raw/master/x.pdf',
    'https://github.com/someone/taxinomitis-docs/raw/master/x.pdf',
    `${WORKSHEETS}../../../../../other/raw/master/x.pdf`,
    `${WORKSHEETS}%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/other/x.pdf`,
    `${WORKSHEETS}worksheet-fooled.docx`,
    `${WORKSHEETS}worksheet-fooled.pdf?download=1`,
    `${WORKSHEETS}worksheet-fooled.pdf#page=2`,
    'http://github.com/IBM/taxinomitis-docs/raw/master/x.pdf',
    'https://github.com.evil.com/IBM/taxinomitis-docs/raw/master/x.pdf',
    'https://raw.githubusercontent.com.evil.com/IBM/taxinomitis-docs/master/x.pdf',
    'not a url',
    '',
  ];

  it('keeps only a PDF under the official worksheet prefixes', () => {
    expect(urls.filter((url) => toMlWorksheetHref(url) !== null)).toEqual(urls.slice(0, 4));
    expect(toMlWorksheetHref(urls[0]!)).toBe(urls[0]);
  });

  it('agrees with the rule the course editor validates with', () => {
    for (const url of urls) {
      expect(toMlWorksheetHref(url) !== null, url).toBe(isMlWorksheetUrl(url));
    }
  });
});

describe('isFrenchWorksheet', () => {
  it('reads the language from the end of the file name', () => {
    expect(isFrenchWorksheet(`${WORKSHEETS}worksheet-lasereyes-fr.pdf`)).toBe(true);
    expect(isFrenchWorksheet(`${WORKSHEETS}WORKSHEET-LASEREYES-FR.PDF`)).toBe(true);
    expect(isFrenchWorksheet(`${WORKSHEETS}worksheet-lasereyes.pdf`)).toBe(false);
    expect(isFrenchWorksheet(`${WORKSHEETS}worksheet-french.pdf`)).toBe(false);
    expect(isFrenchWorksheet(`${WORKSHEETS}worksheet-fr.pdf.zip`)).toBe(false);
    expect(isFrenchWorksheet('worksheet-fr.pdf')).toBe(false);
  });
});

// --- The lesson player's block -----------------------------------------------------------------

const ROOT = path.join(import.meta.dirname, '..', '..');

function catalog(locale: string, namespace: string): Record<string, unknown> {
  return JSON.parse(
    readFileSync(path.join(ROOT, 'src', 'messages', locale, `${namespace}.json`), 'utf8'),
  ) as Record<string, unknown>;
}

function block(
  data: Partial<BlockDataMap['ml_activity']> = {},
  text: Partial<BlockTextMap['ml_activity']> = {},
): LessonBlockOf<'ml_activity'> {
  return {
    id: 'b1',
    courseId: 'c1',
    lessonId: 'l1',
    type: 'ml_activity',
    stage: 'try',
    order: 0,
    defaultLocale: 'en',
    translations: {
      en: {
        title: 'Teach a computer to understand you',
        instructions: '1. Click **Try it now**.\n2. Make a text project.',
        bringBack: 'A screenshot of your project.',
        hint: 'Use at least five examples for each label.',
        ...text,
      },
    },
    data: {
      url: `${SITE}/#!/login`,
      worksheetUrl: `${WORKSHEETS}worksheet-smartclassroom-tryitnow.pdf`,
      projectType: 'text',
      codeTool: 'scratch',
      access: 'try_it_now',
      ...data,
    },
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  };
}

const RUNTIME: LessonRuntime = {
  courseId: 'c1',
  lessonId: 'l1',
  readOnly: false,
  // Not an AI-tutor block: it shows when the school switched the tutor off.
  tutorEnabled: false,
  audience: 'student',
  responses: {},
  quizzes: {},
  latestAttempts: {},
  attemptsRemaining: {},
  projects: {},
  latestSubmissions: {},
};

type ProviderProps = ComponentProps<typeof NextIntlClientProvider>;

function render(
  value: LessonBlockOf<'ml_activity'>,
  locale: 'en' | 'fr' = 'en',
  audience: LessonRuntime['audience'] = 'student',
): string {
  const config: Omit<ProviderProps, 'children'> = {
    locale,
    messages: Object.fromEntries(
      ['lesson', 'common', 'domain'].map((namespace) => [namespace, catalog(locale, namespace)]),
    ),
    timeZone: 'UTC',
  };
  return renderToStaticMarkup(
    createElement(
      NextIntlClientProvider,
      config as ProviderProps,
      createElement(MlActivityBlock, { block: value, runtime: { ...RUNTIME, audience } }),
    ),
  );
}

/** The anchors of the markup: href, rel, target and text without tags. */
function links(html: string): { href: string; rel: string; target: string; text: string }[] {
  return [...html.matchAll(/<a ([^>]*)>(.*?)<\/a>/g)].map(([, attributes, inner]) => {
    const attribute = (name: string) =>
      new RegExp(`${name}="([^"]*)"`).exec(attributes!)?.[1]?.replaceAll('&amp;', '&') ?? '';
    return {
      href: attribute('href'),
      rel: attribute('rel'),
      target: attribute('target'),
      text: inner!.replace(/<[^>]+>/g, '').trim(),
    };
  });
}

describe('MlActivityBlock', () => {
  it('opens the site in a new tab, in the reader’s language, with no opener or referrer', () => {
    const [open, worksheet] = links(render(block()));
    expect(open).toEqual({
      href: `${SITE}/?lang=en#!/login`,
      rel: 'noopener noreferrer',
      target: '_blank',
      text: 'Open Machine Learning for Kids(opens in a new tab)',
    });
    expect(worksheet).toEqual({
      href: `${WORKSHEETS}worksheet-smartclassroom-tryitnow.pdf`,
      rel: 'noopener noreferrer',
      target: '_blank',
      text: 'Official worksheet (PDF)(opens in a new tab)',
    });
    expect(links(render(block(), 'fr'))[0]!.href).toBe(`${SITE}/?lang=fr#!/login`);
  });

  it('shows the notice, the chips, the texts and the credit, and never a frame', () => {
    const html = render(block());
    for (const expected of [
      'Teach a computer to understand you',
      'Machine Learning for Kids',
      'Recognising text',
      'Scratch',
      'No account (“Try it now”)',
      'You are going to another website',
      'Do not type your name',
      'is deleted after a few hours',
      '<strong>Try it now</strong>',
      'What to bring back',
      'A screenshot of your project.',
      '<summary',
      'Use at least five examples for each label.',
      'created by Dale Lane',
      'BY-NC-SA 4.0',
    ]) {
      expect(html, expected).toContain(expected);
    }
    expect(html).not.toContain('<iframe');
  });

  it('leaves out the Try-it-now note, the bring-back part, the hint and the worksheet when unset', () => {
    const html = render(
      block({ access: 'class_account', worksheetUrl: null }, { bringBack: null, hint: null }),
    );
    expect(html).toContain('Class login from your teacher');
    expect(html).not.toContain('is deleted after a few hours');
    expect(html).not.toContain('What to bring back');
    expect(html).not.toContain('<details');
    expect(links(html).map((link) => link.href)).toEqual([`${SITE}/?lang=en#!/login`]);
  });

  it('keeps the texts and shows no button when the stored link fails the check', () => {
    for (const url of ['https://machinelearningforkids.co.uk.evil.com/', 'http://evil.example/']) {
      const html = render(block({ url }));
      expect(links(html), url).toEqual([]);
      expect(html).toContain('The link to this activity is not available.');
      expect(html).toContain('Teach a computer to understand you');
      expect(html).toContain('Make a text project.');
    }
  });

  it('stays in the lesson when the school switched the tutor off', () => {
    expect(visibleBlocks([block()], false).map((shown) => shown.type)).toEqual(['ml_activity']);
  });

  it('drops a worksheet link that fails its check', () => {
    const html = render(block({ worksheetUrl: 'https://evil.example/worksheet.pdf' }));
    expect(links(html).map((link) => link.href)).toEqual([`${SITE}/?lang=en#!/login`]);
  });

  it('tells a French reader when the worksheet is in English', () => {
    const english = links(render(block(), 'fr'))[1]!;
    expect(english.text).toBe('Fiche officielle (PDF, en anglais)(s’ouvre dans un nouvel onglet)');
    const french = links(
      render(block({ worksheetUrl: `${WORKSHEETS}worksheet-lasereyes-fr.pdf` }), 'fr'),
    )[1]!;
    expect(french.text).toBe('Fiche officielle (PDF)(s’ouvre dans un nouvel onglet)');
    expect(links(render(block()))[1]!.text).not.toContain('English');
  });

  it('tells an English reader when the worksheet is in French', () => {
    // The links are data, the same in every language: a bilingual block may link the French one.
    const french = links(
      render(block({ worksheetUrl: `${WORKSHEETS}worksheet-lasereyes-fr.pdf` })),
    );
    expect(french[1]!.text).toBe('Official worksheet (PDF, in French)(opens in a new tab)');
  });

  it('names the Try it now button as the French site does, « Essayer maintenant »', () => {
    // A French reader opens the site with lang=fr, whose button reads « Essayer maintenant ».
    const html = render(block(), 'fr');
    expect(html).toContain('Sans compte («\u00a0Essayer maintenant\u00a0»)');
    expect(html).toContain('Un projet «\u00a0Essayer maintenant\u00a0» (Try it now) est effacé');
    expect(html).not.toContain('«\u00a0Try it now');
  });

  it('shows no access mode and no Try-it-now note for a ready-trained model', () => {
    // /#!/pretrained opens Scratch with no login and creates no project.
    for (const access of ML_ACCESS_MODES) {
      const html = render(
        block({ projectType: 'pretrained', url: `${SITE}/#!/pretrained`, access }),
      );
      expect(html, access).toContain('Ready-trained model');
      expect(html, access).not.toContain('No account');
      expect(html, access).not.toContain('Class login');
      expect(html, access).not.toContain('is deleted after a few hours');
      expect(html, access).toContain('You are going to another website');
    }
  });

  it('speaks to the teacher, not to a child, in a course for teachers', () => {
    const missing = block({ access: 'class_account', url: 'http://evil.example/' });
    for (const locale of ['en', 'fr'] as const) {
      const learner = render(missing, locale);
      const teacher = render(missing, locale, 'teacher');
      const askTeacher = locale === 'en' ? 'your teacher' : 'votre enseignant';
      expect(learner, locale).toContain(askTeacher);
      expect(teacher, locale).not.toContain(askTeacher);
    }
    const teacher = render(missing, 'en', 'teacher');
    expect(teacher).toContain('Class account on the website');
    expect(teacher).toContain('Check your school’s rules before you turn on a webcam');
    expect(teacher).toContain('The link to this activity is not available.');
  });
});

describe('MlActivityData', () => {
  function renderData(projectType: BlockDataMap['ml_activity']['projectType']): string {
    const draft = newBlockDraft('ml_activity', 'en');
    if (draft.type !== 'ml_activity') throw new Error('type');
    const config: Omit<ProviderProps, 'children'> = {
      locale: 'en',
      messages: { courseEditor: catalog('en', 'courseEditor'), common: catalog('en', 'common') },
      timeZone: 'UTC',
    };
    return renderToStaticMarkup(
      createElement(
        NextIntlClientProvider,
        config as ProviderProps,
        createElement(MlActivityData, {
          draft: { ...draft, data: { ...draft.data, projectType } },
          onChange: () => undefined,
          errors: () => undefined,
          context: {
            courseId: 'c1',
            lessonId: 'l1',
            mode: 'admin',
            official: true,
            quizzes: [],
            projects: [],
            currentLinkId: null,
            teacherCourse: false,
          },
          disabled: false,
        }),
      ),
    );
  }

  it('asks how learners use the website, except for a ready-trained model, which needs no login', () => {
    expect(renderData('text')).toContain('How learners use the website');
    expect(renderData('pretrained')).not.toContain('How learners use the website');
  });
});

describe.each(['en', 'fr'])('lesson catalog for ml_activity (%s)', (locale) => {
  it('has a label for every project type, code tool and access mode', () => {
    const ml = (catalog(locale, 'lesson').blocks as Record<string, Record<string, unknown>>).ml!;
    const labels = (group: string) => Object.keys(ml[group] as Record<string, string>);
    expect(labels('projectTypes')).toEqual([...ML_PROJECT_TYPES]);
    expect(labels('codeTools')).toEqual([...ML_CODE_TOOLS]);
    expect(labels('access')).toEqual([...ML_ACCESS_MODES]);
  });

  it('tells authors where a worksheet link comes from, as the rule checks it', () => {
    // The address a teacher copies from GitHub's page (/blob/) is not the PDF's (/raw/master/).
    const start = 'https://github.com/IBM/taxinomitis-docs/raw/master/';
    expect(ML_WORKSHEET_PREFIXES.filter((prefix) => prefix.startsWith(start))).toHaveLength(2);
    const ml = (catalog(locale, 'courseEditor').blocks as Record<string, Record<string, string>>)
      .ml!;
    expect(ml.worksheetUrlHint).toContain(start);
    expect(catalog(locale, 'validation').ml_worksheet_not_allowed).toContain(start);
  });
});

/** Every string of a value, nested objects and arrays included. */
function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (typeof value !== 'object' || value === null) return [];
  return Object.values(value).flatMap(strings);
}

describe('French copy of ml_activity', () => {
  it('uses vous in the lesson namespace, which teachers read too (ARCHITECTURE.md 10.5)', () => {
    for (const text of strings(catalog('fr', 'lesson'))) {
      expect(text).not.toMatch(/\b(tu|ton|ta|tes|toi)\b|\bt’/i);
    }
  });

  it('names the button « Essayer maintenant » in the catalogs and in the French lessons', () => {
    // The English name may only follow the French one, in brackets: "(Try it now)".
    const englishFirst = /(?<!\(\*?)Try it now(?!\*?\))/;
    const french = [...strings(catalog('fr', 'lesson')), ...strings(catalog('fr', 'courseEditor'))];
    // Everything the seed writes, its Machine Learning for Kids lessons included.
    const modules = SEED_COURSES.flatMap((course) => course.modules);
    const projects = SEED_COURSES.flatMap((course) => course.projects);
    for (const courseModule of modules) {
      for (const lesson of courseModule.lessons) {
        for (const seedBlock of lesson.blocks) french.push(...strings(seedBlock.translations.fr));
      }
    }
    for (const project of projects) french.push(...strings(project.input.translations.fr));
    expect(french.length).toBeGreaterThan(0);
    for (const text of french) expect(text).not.toMatch(englishFirst);
  });
});
