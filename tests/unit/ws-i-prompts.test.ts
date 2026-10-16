import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { suggestReview, type AiReviewInput } from '@/lib/ai/grading';
import { buildGradingSystemPrompt, GRADING_PROMPT_VERSION } from '@/lib/ai/prompts/grading';
import {
  buildLabSystemPrompt,
  LAB_NOTICES,
  LAB_PROMPT_VERSION,
  LAB_WORD_LIMITS,
} from '@/lib/ai/prompts/lab';
import {
  buildTutorSystemPrompt,
  FRENCH_ADDRESS,
  TUTOR_PROMPT_VERSION,
} from '@/lib/ai/prompts/tutor';
import { parsePolicyHeader, POLICY_MARKER } from '@/lib/ai/safety';
import { LOCALES } from '@/lib/i18n/config';
import { AGE_BANDS, TUTOR_MODES } from '@/types';

// WS-I core: the prompt review of tutor-2, lab-2 and grading-2 (ARCHITECTURE.md 8.2, 8.4, 8.5,
// 8.6). Additions only: the sentences the older tests assert are checked there.

beforeEach(() => {
  for (const name of ['AI_PROVIDER', 'ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL']) {
    vi.stubEnv(name, undefined);
  }
});
afterEach(() => vi.unstubAllEnvs());

const TUTOR_RULES = [
  'trusted adult right away',
  'local emergency number',
  'Do not include links',
  'You are an AI, not a person',
  'secret from parents or teachers',
  'never suggest meeting, calling, messaging or sending photos to anyone',
  'someone else’s account',
];

describe('prompt versions', () => {
  it('names the new versions in every header', () => {
    expect([TUTOR_PROMPT_VERSION, LAB_PROMPT_VERSION, GRADING_PROMPT_VERSION]).toEqual([
      'tutor-2',
      'lab-2',
      'grading-2',
    ]);
    const tutor = buildTutorSystemPrompt({
      mode: 'hint',
      ageBand: '8-10',
      locale: 'en',
      hasGradedWork: false,
    });
    const lab = buildLabSystemPrompt({ toolId: 'text', ageBand: '8-10', locale: 'en' });
    const grading = buildGradingSystemPrompt({ locale: 'en', ageBand: '8-10' });
    expect(parsePolicyHeader(tutor)?.version).toBe('tutor-2');
    expect(parsePolicyHeader(lab)?.version).toBe('lab-2');
    expect(parsePolicyHeader(grading)?.version).toBe('grading-2');
  });
});

describe('tutor-2', () => {
  const combos = TUTOR_MODES.flatMap((mode) =>
    AGE_BANDS.flatMap((ageBand) =>
      LOCALES.flatMap((locale) =>
        [true, false].map((hasGradedWork) => ({ mode, ageBand, locale, hasGradedWork })),
      ),
    ),
  );

  it('holds rules 8 to 11 for every mode, age band, locale and graded flag', () => {
    for (const params of combos) {
      const system = buildTutorSystemPrompt(params);
      const label = JSON.stringify(params);
      expect(system.startsWith(`${POLICY_MARKER} purpose=tutor version=tutor-2 `), label).toBe(
        true,
      );
      for (const rule of TUTOR_RULES) expect(system, `${label} ${rule}`).toContain(rule);
      for (const rule of ['8. ', '9. ', '10. ', '11. '])
        expect(system, label).toContain(`\n${rule}`);
      expect(system.length, label).toBeLessThan(6_000);
      // Plain, calm English: no capitals for emphasis below the header.
      expect(system.split('\n').slice(1).join('\n'), label).not.toMatch(/\b[A-Z]{3,}\b/);
    }
  });

  it('tells the model how to address the learner in French only', () => {
    const base = { mode: 'explain', hasGradedWork: false } as const;
    const frAdult = buildTutorSystemPrompt({ ...base, ageBand: 'adult', locale: 'fr' });
    const frChild = buildTutorSystemPrompt({ ...base, ageBand: '11-12', locale: 'fr' });
    expect(frAdult).toContain('In French, address the learner as “vous”.');
    expect(frAdult).not.toContain('“tu”');
    expect(frChild).toContain('In French, address the learner as “tu”.');
    expect(frChild).not.toContain('“vous”');
    for (const ageBand of AGE_BANDS) {
      const en = buildTutorSystemPrompt({ ...base, ageBand, locale: 'en' });
      expect(en).not.toContain('In French, address');
    }
    expect(Object.keys(FRENCH_ADDRESS).sort()).toEqual([...AGE_BANDS].sort());
  });
});

describe('lab-2', () => {
  it('limits the length by age band', () => {
    expect(LAB_WORD_LIMITS).toEqual({
      '8-10': 100,
      '11-12': 150,
      '13-15': 200,
      '16-18': 250,
      adult: 250,
    });
    for (const ageBand of AGE_BANDS) {
      const system = buildLabSystemPrompt({ toolId: 'text', ageBand, locale: 'en' });
      expect(system).toContain(`in at most ${LAB_WORD_LIMITS[ageBand]} words`);
      expect(system).not.toContain('In French, address');
    }
  });

  it('has the real-people, safeguarding and identity bullets, and the French address', () => {
    const system = buildLabSystemPrompt({ toolId: 'text', ageBand: '13-15', locale: 'fr' });
    expect(system).toContain('Do not write about real, identifiable people');
    expect(system).toContain('do not write fake news presented as real');
    expect(system).toContain('without links, that they should talk to a trusted adult right away');
    expect(system).toContain('local emergency number');
    expect(system).toContain('You are an AI. Never claim to be a person.');
    expect(system).toContain('In French, address the learner as “tu”.');
  });

  it('points to a trusted adult in the neutral notice', () => {
    expect(LAB_NOTICES.en.cannotHelp).toContain('adult you trust');
    expect(LAB_NOTICES.fr.cannotHelp).toContain('adulte de confiance');
    expect(LAB_NOTICES.fr.cannotHelp).not.toMatch(/'/);
  });
});

describe('grading-2', () => {
  it('forbids accusations and comments on the person, and flags a learner at risk', () => {
    const system = buildGradingSystemPrompt({ locale: 'fr', ageBand: '11-12' });
    expect(system).toContain('never on the student as a person');
    expect(system).toContain('Never accuse the student of copying, cheating or using AI');
    expect(system).toContain('Never mention the flags.');
    expect(system).toContain('add the flag "unsafe_content" and keep the feedback neutral');
  });

  it('stores the new version on a mock review', async () => {
    const input: AiReviewInput = {
      locale: 'en',
      ageBand: '13-15',
      projectTitle: 'My chatbot',
      projectBrief: 'Build a chatbot.',
      requirements: 'It answers three questions.',
      rubric: [
        { key: 'creativity', weight: 25 },
        { key: 'technicalQuality', weight: 25 },
        { key: 'understanding', weight: 25 },
        { key: 'responsibleAi', weight: 25 },
      ],
      submission: {
        title: 'Sparky',
        description: 'A bot about planets.',
        type: 'text',
        text: 'My bot answers questions about planets, and it says when it is not sure.',
        code: null,
        codeLanguage: null,
        linkHost: null,
        attachments: [],
        truncated: false,
      },
    };
    const review = await suggestReview(input);
    expect(review.promptVersion).toBe(GRADING_PROMPT_VERSION);
  });
});
