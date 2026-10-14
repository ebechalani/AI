import { describe, expect, it } from 'vitest';
import { normalizeAnswer } from '@/lib/learning/quiz-grading';

// Characters that are invisible, or that look like another one, are written as code point
// escapes, so the file reads the same in every editor.

const COMBINING_ACUTE = '\u{301}';
const NO_BREAK_SPACE = '\u{a0}';
const ZERO_WIDTH_SPACE = '\u{200b}';
const RIGHT_TO_LEFT_MARK = '\u{200f}';
const BYTE_ORDER_MARK = '\u{feff}';

// Arabic letters and marks.
const ALEF = '\u{627}';
const ALEF_HAMZA_ABOVE = '\u{623}';
const ALEF_HAMZA_BELOW = '\u{625}';
const ALEF_MADDA = '\u{622}';
const ALEF_WASLA = '\u{671}';
const ALEF_MAQSURA = '\u{649}';
const WAW = '\u{648}';
const WAW_HAMZA = '\u{624}';
const YEH = '\u{64a}';
const YEH_HAMZA = '\u{626}';
const TATWEEL = '\u{640}';
const FATHA = '\u{64e}';
const SUKUN = '\u{652}';
const HAH = '\u{62d}';
const MEEM = '\u{645}';
const DAL = '\u{62f}';
const NOON = '\u{646}';
const AIN = '\u{639}';
const LAM = '\u{644}';

const AHMAD_PLAIN = `${ALEF}${HAH}${MEEM}${DAL}`;

describe('normalizeAnswer', () => {
  it('ignores case, surrounding whitespace and runs of whitespace', () => {
    expect(normalizeAnswer('  Machine \t\n  LEARNING ', 'en')).toBe('machine learning');
    expect(normalizeAnswer(`machine${NO_BREAK_SPACE}learning`, 'en')).toBe('machine learning');
  });

  it('treats a precomposed letter, a letter with a combining accent and the bare letter alike', () => {
    const forms = ['\u{e9}cole', `e${COMBINING_ACUTE}cole`, 'ecole', '\u{c9}COLE'];
    expect(forms.map((form) => normalizeAnswer(form, 'fr'))).toEqual([
      'ecole',
      'ecole',
      'ecole',
      'ecole',
    ]);
    expect(normalizeAnswer('Données  Entraînement', 'fr')).toBe('donnees entrainement');
  });

  it('folds compatibility forms (NFKC)', () => {
    // Full-width "AI", the "fi" ligature, a superscript two.
    expect(normalizeAnswer('\u{ff21}\u{ff29}', 'en')).toBe('ai');
    expect(normalizeAnswer('\u{fb01}ne', 'en')).toBe('fine');
    expect(normalizeAnswer('x\u{b2}', 'en')).toBe('x2');
  });

  it('folds case beyond toLowerCase', () => {
    expect(normalizeAnswer('STRASSE', 'de')).toBe(normalizeAnswer('straße', 'de'));
    // A word-final capital sigma lowers to the final form; a typed medial sigma must match it.
    expect(normalizeAnswer('ΟΔΟΣ', 'el')).toBe(normalizeAnswer('οδοσ', 'el'));
  });

  it('drops invisible characters', () => {
    expect(normalizeAnswer(`ro${ZERO_WIDTH_SPACE}bot${RIGHT_TO_LEFT_MARK}`, 'en')).toBe('robot');
    expect(normalizeAnswer(`${BYTE_ORDER_MARK}robot`, 'en')).toBe('robot');
  });

  it('keeps the marks that spell a word in scripts where they are not accents', () => {
    // Thai "horse" (mo ma, mai tho, sara aa) and "come" (mo ma, sara aa) differ by a tone mark.
    const horse = '\u{e21}\u{e49}\u{e32}';
    const come = '\u{e21}\u{e32}';
    expect(normalizeAnswer(horse, 'th')).toBe(horse);
    expect(normalizeAnswer(horse, 'th')).not.toBe(normalizeAnswer(come, 'th'));
  });

  it('is idempotent', () => {
    for (const [text, locale] of [
      ['  École  Supérieure ', 'fr'],
      [`${ALEF_HAMZA_ABOVE}${FATHA}${HAH}${SUKUN}${MEEM}${FATHA}${DAL}${TATWEEL}`, 'ar'],
      ['Straße', 'de'],
    ] as const) {
      const once = normalizeAnswer(text, locale);
      expect(normalizeAnswer(once, locale)).toBe(once);
    }
  });

  describe('Arabic', () => {
    it('strips harakat and tatweel', () => {
      const vowelled = `${ALEF}${FATHA}${HAH}${SUKUN}${MEEM}${FATHA}${DAL}`;
      const stretched = `${ALEF}${HAH}${TATWEEL}${TATWEEL}${TATWEEL}${MEEM}${DAL}`;
      expect(normalizeAnswer(vowelled, 'ar')).toBe(AHMAD_PLAIN);
      expect(normalizeAnswer(stretched, 'ar')).toBe(AHMAD_PLAIN);
    });

    it('unifies the alef forms', () => {
      for (const alef of [ALEF_HAMZA_ABOVE, ALEF_HAMZA_BELOW, ALEF_MADDA, ALEF_WASLA]) {
        expect(normalizeAnswer(`${alef}${HAH}${MEEM}${DAL}`, 'ar')).toBe(AHMAD_PLAIN);
      }
    });

    it('reads waw and yeh with a hamza as waw and yeh, and alef maqsura as yeh', () => {
      expect(normalizeAnswer(`${MEEM}${WAW_HAMZA}${MEEM}${NOON}`, 'ar')).toBe(
        `${MEEM}${WAW}${MEEM}${NOON}`,
      );
      expect(normalizeAnswer(`${MEEM}${YEH_HAMZA}${DAL}`, 'ar')).toBe(`${MEEM}${YEH}${DAL}`);
      expect(normalizeAnswer(`${AIN}${LAM}${ALEF_MAQSURA}`, 'ar')).toBe(`${AIN}${LAM}${YEH}`);
    });

    it('applies to regional variants of the locale', () => {
      expect(normalizeAnswer(`${ALEF_HAMZA_ABOVE}${HAH}${MEEM}${DAL}`, 'ar-LB')).toBe(AHMAD_PLAIN);
      expect(normalizeAnswer(`${ALEF_HAMZA_ABOVE}${HAH}${MEEM}${DAL}`, 'AR')).toBe(AHMAD_PLAIN);
    });

    it('is not applied under another locale', () => {
      const hamza = `${ALEF_HAMZA_ABOVE}${HAH}${MEEM}${DAL}`;
      const stretched = `${ALEF}${HAH}${TATWEEL}${MEEM}${DAL}`;
      expect(normalizeAnswer(hamza, 'en')).toBe(hamza);
      expect(normalizeAnswer(stretched, 'fr')).toBe(stretched);
      // 'ar' is matched as a language tag, not as a prefix.
      expect(normalizeAnswer(hamza, 'arn')).toBe(hamza);
    });
  });
});
