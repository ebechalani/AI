import { LOCALES } from '@/lib/i18n/config';
import type { Locale, Localized } from '@/types/common';

// The editor keeps every translatable text of a document in one draft, for every language the
// UI edits ('' = empty), and turns it back into a `Localized` map on save. Entries in other
// languages (content the UI does not edit yet) travel alongside unchanged.

export const EDITABLE_LOCALES: readonly Locale[] = LOCALES;

/** Every field of every editable locale; '' = empty. */
export type TextDraft<F extends string> = Record<Locale, Record<F, string>>;

export function isEditableLocale(value: string): value is Locale {
  return (EDITABLE_LOCALES as readonly string[]).includes(value);
}

function blank(value: string): boolean {
  return value.trim() === '';
}

/** A missing entry or a null value reads as ''. */
export function textDraftFrom<F extends string>(
  translations: Localized<Partial<Record<F, string | null>>>,
  fields: readonly F[],
): TextDraft<F> {
  const draft = {} as TextDraft<F>;
  for (const locale of EDITABLE_LOCALES) {
    const entry = translations[locale];
    const fieldsOf = {} as Record<F, string>;
    for (const field of fields) {
      const value = entry?.[field];
      fieldsOf[field] = typeof value === 'string' ? value : '';
    }
    draft[locale] = fieldsOf;
  }
  return draft;
}

/**
 * Per editable locale, the entry is kept when it is the default locale or has a field that is
 * not blank; in a kept entry a blank nullable field becomes null, a blank other field ''. Values
 * are not trimmed here (the schema does it). Then every entry of `extra` is copied unchanged.
 */
export function textDraftTo<F extends string>(
  draft: TextDraft<F>,
  options: {
    fields: readonly F[];
    nullable?: readonly F[];
    defaultLocale: Locale;
    extra?: Localized<unknown>;
  },
): Localized<Record<F, string | null>> {
  const nullable = new Set<string>(options.nullable ?? []);
  const result: Localized<Record<F, string | null>> = {};
  for (const locale of EDITABLE_LOCALES) {
    const entry = draft[locale];
    const hasText = options.fields.some((field) => !blank(entry?.[field] ?? ''));
    if (locale !== options.defaultLocale && !hasText) continue;
    const out = {} as Record<F, string | null>;
    for (const field of options.fields) {
      const value = entry?.[field] ?? '';
      out[field] = blank(value) ? (nullable.has(field) ? null : '') : value;
    }
    result[locale] = out;
  }
  for (const [locale, entry] of Object.entries(options.extra ?? {})) {
    if (entry !== undefined) result[locale] = entry as Record<F, string | null>;
  }
  return result;
}

/** The entries whose key is not an editable locale: they survive a save. */
export function extraLocales<T>(translations: Localized<T>): Localized<T> {
  const extra: Localized<T> = {};
  for (const [locale, entry] of Object.entries(translations)) {
    if (!isEditableLocale(locale) && entry !== undefined) extra[locale] = entry;
  }
  return extra;
}

export type TranslationState = 'required' | 'translated' | 'missing';
export const TRANSLATION_STATES: readonly TranslationState[] = ['required', 'translated', 'missing'];

/** Default locale → 'required'; a non-blank field → 'translated'; else 'missing'. */
export function translationState(
  entry: Record<string, string> | undefined,
  locale: Locale,
  defaultLocale: Locale,
): TranslationState {
  if (locale === defaultLocale) return 'required';
  return Object.values(entry ?? {}).some((value) => typeof value === 'string' && !blank(value))
    ? 'translated'
    : 'missing';
}

/** The states of every editable locale of one draft. */
export function translationStates<F extends string>(
  draft: TextDraft<F>,
  defaultLocale: Locale,
): Record<Locale, TranslationState> {
  const states = {} as Record<Locale, TranslationState>;
  for (const locale of EDITABLE_LOCALES) {
    states[locale] = translationState(draft[locale], locale, defaultLocale);
  }
  return states;
}

const LOCALE_PARENTS = new Set(['translations', 'acceptedAnswers', 'explanation']);

/**
 * The editable locale right after 'translations', 'acceptedAnswers' or 'explanation' anywhere
 * in the path ('questions.2.options.0.translations.fr.text' → 'fr'); anything else → null.
 */
export function localeOfPath(path: string): Locale | null {
  const parts = path.split('.');
  for (let index = 0; index < parts.length - 1; index += 1) {
    const next = parts[index + 1]!;
    if (LOCALE_PARENTS.has(parts[index]!) && isEditableLocale(next)) return next;
  }
  return null;
}

const PREFIX = /^(?:input|patch)\./;

/**
 * Removes one leading 'input.' or 'patch.' from each key: server keys come with and without
 * it. Colliding keys merge their messages without repeats.
 */
export function stripInputPrefix(fieldErrors: Record<string, string[]>): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [path, messages] of Object.entries(fieldErrors)) {
    const key = path.replace(PREFIX, '');
    const merged = (result[key] ??= []);
    for (const message of messages) if (!merged.includes(message)) merged.push(message);
  }
  return result;
}

function startsWithSegment(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}.`);
}

/**
 * The keys sorted by the index of the first `order` prefix they start with (keys matching none
 * last, stable), so "the first error" is the first in reading order.
 */
export function orderedErrorPaths(
  fieldErrors: Record<string, string[]>,
  order: readonly string[],
): string[] {
  const rank = (path: string) => {
    const index = order.findIndex((prefix) => startsWithSegment(path, prefix));
    return index === -1 ? order.length : index;
  };
  return Object.keys(fieldErrors)
    .map((path, position) => ({ path, position, rank: rank(path) }))
    .sort((a, b) => a.rank - b.rank || a.position - b.position)
    .map((entry) => entry.path);
}

/** How many of the errors sit in each editable locale. */
export function errorsPerLocale(paths: readonly string[]): Partial<Record<Locale, number>> {
  const counts: Partial<Record<Locale, number>> = {};
  for (const path of paths) {
    const locale = localeOfPath(path);
    if (locale !== null) counts[locale] = (counts[locale] ?? 0) + 1;
  }
  return counts;
}
