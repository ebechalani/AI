import { describe, expect, it } from 'vitest';
import { hasTranslation, pickTranslation } from '@/lib/i18n/content';
import type { Localized } from '@/types';

interface CourseText {
  title: string;
  summary: string;
  outcomes: string[];
}

const course: Localized<CourseText> = {
  en: { title: 'What is AI?', summary: 'A first look.', outcomes: ['Explain what AI is'] },
  fr: { title: "Qu'est-ce que l'IA ?", summary: 'Un premier regard.', outcomes: ['Expliquer'] },
};

describe('pickTranslation', () => {
  it('returns the requested locale when it is complete', () => {
    expect(pickTranslation(course, 'fr', 'en')).toEqual(course.fr);
    expect(pickTranslation(course, 'en', 'en')).toEqual(course.en);
  });

  it('falls back field by field, so a half-translated entry shows no blanks', () => {
    const partial: Localized<CourseText> = {
      en: course.en,
      fr: { title: "Qu'est-ce que l'IA ?", summary: '   ', outcomes: [] },
    };
    expect(pickTranslation(partial, 'fr', 'en')).toEqual({
      title: "Qu'est-ce que l'IA ?",
      summary: 'A first look.',
      outcomes: ['Explain what AI is'],
    });
  });

  it('fills a field the requested locale does not have at all', () => {
    const partial = {
      en: course.en,
      fr: { title: 'Titre' },
    } as unknown as Localized<CourseText>;
    expect(pickTranslation(partial, 'fr', 'en')).toEqual({ ...course.en, title: 'Titre' });
  });

  it('resolves in the order: requested, default, English, first locale present', () => {
    const text: Localized<{ a: string; b: string; c: string; d: string }> = {
      de: { a: 'de-a', b: 'de-b', c: 'de-c', d: 'de-d' },
      en: { a: 'en-a', b: 'en-b', c: 'en-c', d: '' },
      ar: { a: 'ar-a', b: 'ar-b', c: '', d: '' },
      fr: { a: 'fr-a', b: '', c: '', d: '' },
    };
    expect(pickTranslation(text, 'fr', 'ar')).toEqual({
      a: 'fr-a',
      b: 'ar-b',
      c: 'en-c',
      d: 'de-d',
    });
  });

  it('uses the default locale for a locale the document does not carry', () => {
    const text: Localized<{ title: string }> = { ar: { title: 'عنوان' }, en: { title: 'Title' } };
    expect(pickTranslation(text, 'fr', 'ar')).toEqual({ title: 'عنوان' });
  });

  it('uses English when neither the requested nor the default locale is present', () => {
    const text: Localized<{ title: string }> = { de: { title: 'Titel' }, en: { title: 'Title' } };
    expect(pickTranslation(text, 'fr', 'ar')).toEqual({ title: 'Title' });
  });

  it('uses the first locale present as the last resort', () => {
    const text: Localized<{ title: string }> = { de: { title: 'Titel' }, it: { title: 'Titolo' } };
    expect(pickTranslation(text, 'fr', 'ar')).toEqual({ title: 'Titel' });
  });

  it('keeps the first defined value of a field that is blank everywhere', () => {
    const image: Localized<{ alt: string; caption: string | null }> = {
      en: { alt: 'A robot', caption: null },
      fr: { alt: 'Un robot', caption: '' },
    };
    expect(pickTranslation(image, 'en', 'en')).toEqual({ alt: 'A robot', caption: null });
    expect(pickTranslation(image, 'fr', 'en')).toEqual({ alt: 'Un robot', caption: '' });
  });

  it('skips an entry that is undefined or null', () => {
    const text = { fr: undefined, ar: null, en: { title: 'Title' } } as unknown as Localized<{
      title: string;
    }>;
    expect(pickTranslation(text, 'fr', 'ar')).toEqual({ title: 'Title' });
  });

  it('resolves a list-valued map as one unit', () => {
    const accepted: Localized<string[]> = { en: ['robot', 'a robot'], fr: [], ar: ['روبوت'] };
    expect(pickTranslation(accepted, 'ar', 'en')).toEqual(['روبوت']);
    // An empty list is blank: the default locale's list is used whole, never merged.
    expect(pickTranslation(accepted, 'fr', 'en')).toEqual(['robot', 'a robot']);
    expect(pickTranslation(accepted, 'de', 'en')).toEqual(['robot', 'a robot']);
    expect(pickTranslation({ fr: [], en: [] } as Localized<string[]>, 'fr', 'en')).toEqual([]);
  });

  it('returns an empty object for an empty map', () => {
    expect(pickTranslation({} as Localized<CourseText>, 'fr', 'en')).toEqual({});
  });

  it('does not change the document', () => {
    const partial: Localized<CourseText> = {
      en: course.en,
      fr: { title: 'Titre', summary: '', outcomes: [] },
    };
    const before = structuredClone(partial);
    pickTranslation(partial, 'fr', 'en');
    expect(partial).toEqual(before);
  });
});

describe('hasTranslation', () => {
  it('is true when the exact locale has at least one non-blank field', () => {
    expect(hasTranslation(course, 'fr')).toBe(true);
    expect(hasTranslation({ fr: { title: 'Titre', summary: '', outcomes: [] } }, 'fr')).toBe(true);
  });

  it('is false for a missing locale or an entry with blank fields only', () => {
    expect(hasTranslation(course, 'ar')).toBe(false);
    expect(hasTranslation({ fr: { title: '  ', summary: '', outcomes: [] } }, 'fr')).toBe(false);
    expect(hasTranslation({ fr: { caption: null } }, 'fr')).toBe(false);
    expect(hasTranslation({ fr: undefined }, 'fr')).toBe(false);
  });

  it('does not fall back to another locale', () => {
    expect(hasTranslation({ en: { title: 'Title' } }, 'fr')).toBe(false);
  });

  it('handles list-valued maps', () => {
    const accepted: Localized<string[]> = { en: ['robot'], fr: [] };
    expect(hasTranslation(accepted, 'en')).toBe(true);
    expect(hasTranslation(accepted, 'fr')).toBe(false);
  });
});
