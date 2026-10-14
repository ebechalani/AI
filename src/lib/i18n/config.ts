// This file imports nothing: src/types and src/lib/schemas derive `Locale` from LOCALES.

export const LOCALES = ['en', 'fr'] as const;

type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const RTL_LOCALES: readonly Locale[] = [];

// Each language is named in itself, which is how a language switcher lists them.
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
};

export function getDirection(locale: string): 'ltr' | 'rtl' {
  return (RTL_LOCALES as readonly string[]).includes(locale) ? 'rtl' : 'ltr';
}
