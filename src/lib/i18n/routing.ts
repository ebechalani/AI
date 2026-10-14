import { defineRouting } from 'next-intl/routing';
import { DEFAULT_LOCALE, LOCALES } from './config';

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
});

// Narrows next-intl's Locale from string to the configured union, so useLocale() and
// getLocale() return the same type as `Locale` in src/types.
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof LOCALES)[number];
  }
}
