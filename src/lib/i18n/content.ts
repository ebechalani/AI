// The shape of Localized<T> (src/types/common.ts), accepted structurally.
type TranslationMap<T> = { readonly [locale: string]: T | undefined };

const FALLBACK_LOCALE = 'en';

function isBlank(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  return Array.isArray(value) && value.length === 0;
}

// Requested locale, then the document's default locale, then English, then whatever else the
// document holds, in key order.
function resolutionOrder(
  translations: TranslationMap<unknown>,
  locale: string,
  defaultLocale: string,
): string[] {
  const candidates = [locale, defaultLocale, FALLBACK_LOCALE, ...Object.keys(translations)];
  return [...new Set(candidates)].filter((candidate) => translations[candidate] != null);
}

/**
 * Resolves the text of a translated document for one locale, field by field: a field that is
 * missing or blank in the requested locale is taken from the next locale in the order above,
 * so a half-translated entry never renders blanks. A field that is blank everywhere keeps its
 * first defined value (for example `null` for an optional caption).
 */
export function pickTranslation<T extends object>(
  translations: TranslationMap<T>,
  locale: string,
  defaultLocale: string,
): T {
  const entries = resolutionOrder(translations, locale, defaultLocale).map(
    (candidate) => translations[candidate] as T,
  );

  // A list-valued translation (accepted answers) is one unit, not a record of fields.
  if (entries.some(Array.isArray)) {
    return (entries.find((entry) => !isBlank(entry)) ?? entries[0] ?? []) as T;
  }

  const picked: Record<string, unknown> = {};
  for (const entry of entries as Record<string, unknown>[]) {
    for (const [field, value] of Object.entries(entry)) {
      if (isBlank(picked[field]) && (!isBlank(value) || picked[field] === undefined)) {
        picked[field] = value;
      }
    }
  }
  return picked as T;
}

/** True when the document carries text of its own for `locale`, in at least one field. */
export function hasTranslation<T extends object>(
  translations: TranslationMap<T>,
  locale: string,
): boolean {
  const entry = translations[locale];
  if (entry == null) return false;
  return Array.isArray(entry) ? entry.length > 0 : Object.values(entry).some((v) => !isBlank(v));
}
