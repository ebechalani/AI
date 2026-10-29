// Building blocks shared by every schema file. No 'server-only': client forms validate with
// the same schemas the server actions parse with.
//
// Every message a schema produces is a key of the `validation` message namespace, never text
// (ARCHITECTURE.md 10.1). The builders below label each check with its key, so a feature
// schema written with them needs to name a key only where a more specific one exists.

import { z } from 'zod';
import { LOCALES } from '@/lib/i18n/config';
import { CONTENT_LIMITS, FILE_ID_PATTERN } from '@/lib/limits';

// --- Message keys ------------------------------------------------------------------------------

/**
 * The keys of src/messages/<locale>/validation.json, and the only messages a schema may set.
 * tests/unit/schemas.test.ts fails when this list and the two catalogs differ.
 */
export const VALIDATION_KEYS = [
  'required',
  'invalid',
  'too_short',
  'too_long',
  'too_small',
  'too_big',
  'too_few',
  'too_many',
  'duplicate',
  'invalid_choice',
  'invalid_email',
  'invalid_url',
  'invalid_number',
  'invalid_integer',
  'invalid_date',
  'date_order',
  'age_range',
  'password_too_short',
  'passwords_mismatch',
  'username_invalid',
  'display_name_length',
  'join_code_invalid',
  'terms_required',
  'age_band_not_allowed',
  'weights_sum',
  'correct_option_required',
  'default_locale_required',
  'content_required',
  'file_too_large',
  'file_type_not_allowed',
  'file_name_invalid',
  'too_many_files',
  'embed_not_allowed',
  'video_id_invalid',
  'ml_link_not_allowed',
  'ml_worksheet_not_allowed',
] as const;

export type ValidationKey = (typeof VALIDATION_KEYS)[number];

export function isValidationKey(value: string): value is ValidationKey {
  return (VALIDATION_KEYS as readonly string[]).includes(value);
}

/** The fieldErrors key for a problem with the input as a whole (an issue with an empty path). */
export const FORM_ERROR_KEY = '_form';

type RawIssue = Parameters<z.core.$ZodErrorMap>[0];

/** Error map: a missing value reads "required" whatever the field expects; a present one gets `key`. */
export const whenPresent =
  (key: ValidationKey) =>
  (issue: { input?: unknown }): ValidationKey =>
    issue.input === undefined || issue.input === null ? 'required' : key;

// The key for an issue that no schema labelled: zod's own English text never leaves a parse.
function fallbackKey(issue: RawIssue): ValidationKey {
  switch (issue.code) {
    case 'invalid_type':
      if (issue.input === undefined || issue.input === null) return 'required';
      if (issue.expected === 'int') return 'invalid_integer';
      return issue.expected === 'number' ? 'invalid_number' : 'invalid';
    case 'too_small':
      if (issue.origin === 'string') return issue.input === '' ? 'required' : 'too_short';
      if (issue.origin === 'array' || issue.origin === 'set') return 'too_few';
      return 'too_small';
    case 'too_big':
      if (issue.origin === 'string') return 'too_long';
      if (issue.origin === 'array' || issue.origin === 'set') return 'too_many';
      return issue.origin === 'file' ? 'file_too_large' : 'too_big';
    case 'invalid_format':
      if (issue.format === 'email') return 'invalid_email';
      if (issue.format === 'url') return 'invalid_url';
      return issue.format === 'datetime' || issue.format === 'date' ? 'invalid_date' : 'invalid';
    case 'invalid_value':
      return 'invalid_choice';
    case 'not_multiple_of':
      return 'invalid_number';
    default:
      return 'invalid';
  }
}

// --- Parsing -----------------------------------------------------------------------------------

export type ParsedInput<T> =
  { success: true; data: T } | { success: false; fieldErrors: Record<string, string[]> };

/**
 * Keys are dot-joined paths ('translations.en.title', 'questions.0.options'); values are the
 * issue messages, unchanged. A form shows a message that is not a validation key as 'invalid'.
 */
export function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.length > 0 ? issue.path.map(String).join('.') : FORM_ERROR_KEY;
    const messages = (fieldErrors[field] ??= []);
    if (!messages.includes(issue.message)) messages.push(issue.message);
  }
  return fieldErrors;
}

/**
 * The one way to run a schema: runAction uses it for every action, and forms use it to
 * validate before submitting, so both produce the same `fieldErrors`. A bare
 * `schema.safeParse()` skips the fallback map and can yield zod's English text.
 */
export function parseInput<T>(schema: z.ZodType<T>, input: unknown): ParsedInput<T> {
  const result = schema.safeParse(input, { error: fallbackKey });
  return result.success
    ? { success: true, data: result.data }
    : { success: false, fieldErrors: toFieldErrors(result.error) };
}

// --- Builders ----------------------------------------------------------------------------------

/**
 * A string of at most `max` characters, possibly empty. Trimmed unless `trim` is false
 * (code keeps its leading whitespace).
 */
export function text(max: number, options: { trim?: boolean } = {}) {
  const base = z.string({ error: whenPresent('invalid') });
  return (options.trim === false ? base : base.trim()).max(max, 'too_long');
}

/** Like `text`, and not blank. */
export function requiredText(max: number, options: { trim?: boolean } = {}) {
  return text(max, options).refine((value) => value.trim() !== '', 'required');
}

export function int(min: number, max: number) {
  return z
    .number({ error: whenPresent('invalid_number') })
    .int('invalid_integer')
    .min(min, 'too_small')
    .max(max, 'too_big');
}

export function bool() {
  return z.boolean({ error: whenPresent('invalid') });
}

export function oneOf<const T extends readonly [string, ...string[]]>(values: T) {
  return z.enum(values, { error: whenPresent('invalid_choice') });
}

/**
 * `oneOf` for a union written inline in a type, which has no value tuple to validate against:
 * `unionOf<TutorTurn['role']>()(['user', 'assistant'])`. The list must name every member, so
 * adding one to the type fails the build here instead of being rejected at run time.
 */
export function unionOf<U extends string>() {
  return <const T extends readonly [U, ...U[]]>(
    values: T & ([U] extends [T[number]] ? unknown : never),
  ) => oneOf(values as T);
}

export function obj<T extends z.core.$ZodLooseShape>(shape: T) {
  return z.object(shape, { error: whenPresent('invalid') });
}

export function list<T extends z.ZodType>(item: T, options: { min?: number; max: number }) {
  return z
    .array(item, { error: whenPresent('invalid') })
    .min(options.min ?? 0, options.min === 1 ? 'required' : 'too_few')
    .max(options.max, 'too_many');
}

/** A list of strings in which no value may appear twice. */
export function uniqueList<T extends z.ZodType<string>>(
  item: T,
  options: { min?: number; max: number },
) {
  return list(item, options).refine((items) => new Set(items).size === items.length, 'duplicate');
}

// --- Identifiers -------------------------------------------------------------------------------

/**
 * A document id on its own: a Firestore auto-id, an Auth uid or a slug. It never contains
 * '_', which is what keeps composite ids (`{uid}_{courseId}_{quizId}_{n}`) unambiguous.
 */
export const ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/;

/** An id built from several ids: enrollment, quiz attempt, submission, certificate. */
export const COMPOSITE_ID_PATTERN = /^[A-Za-z0-9_-]{1,300}$/;

export const idSchema = z.string({ error: whenPresent('invalid') }).regex(ID_PATTERN, 'invalid');

export const compositeIdSchema = z
  .string({ error: whenPresent('invalid') })
  .regex(COMPOSITE_ID_PATTERN, 'invalid');

export const fileIdSchema = z
  .string({ error: whenPresent('invalid') })
  .regex(FILE_ID_PATTERN, 'invalid');

/** The id of a document to update, or null to create one. */
export const idOrNullSchema = idSchema.nullable();

// --- Dates, addresses, numbers -----------------------------------------------------------------

/** An ISO 8601 date-time with 'Z' or an offset, as `Date.prototype.toISOString()` produces. */
export const isoDateSchema = z.iso.datetime({ offset: true, error: whenPresent('invalid_date') });

export function emailSchema(maxChars: number) {
  return z
    .string({ error: whenPresent('invalid_email') })
    .trim()
    .toLowerCase()
    .max(maxChars, 'too_long')
    .pipe(z.email({ error: 'invalid_email' }));
}

/** An absolute https URL with a real host name. */
export function httpsUrlSchema(maxChars: number) {
  return z
    .string({ error: whenPresent('invalid_url') })
    .trim()
    .max(maxChars, 'too_long')
    .pipe(z.url({ protocol: /^https$/, hostname: z.regexes.domain, error: 'invalid_url' }));
}

export interface AgeRangeFields {
  ageMin?: number | null;
  ageMax?: number | null;
}

/** Both null, or min <= max. Reported on `ageMax`. */
export function checkAgeRange(value: AgeRangeFields, ctx: z.core.$RefinementCtx): void {
  if (value.ageMin != null && value.ageMax != null && value.ageMin > value.ageMax) {
    ctx.addIssue({ code: 'custom', message: 'age_range', path: ['ageMax'] });
  }
}

/** `end` must be later than `start`. Reported on the `end` field. */
export function checkDateOrder<S extends string, E extends string>(start: S, end: E) {
  return (value: { [K in S | E]?: string }, ctx: z.core.$RefinementCtx): void => {
    const from = value[start];
    const to = value[end];
    if (from !== undefined && to !== undefined && Date.parse(to) <= Date.parse(from)) {
      ctx.addIssue({ code: 'custom', message: 'date_order', path: [end] });
    }
  };
}

// --- Translations ------------------------------------------------------------------------------

export const localeSchema = oneOf(LOCALES);

// A document may hold a language the UI has not enabled yet ('ar'), so the key is any
// well-formed language tag rather than one of LOCALES.
const LOCALE_KEY_PATTERN = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

/** `Localized<T>`: a map from language tag to `entry`. */
export function localized<T extends z.ZodType>(entry: T) {
  return z
    .record(z.string().regex(LOCALE_KEY_PATTERN), entry, { error: whenPresent('invalid') })
    .refine((map) => Object.keys(map).length <= CONTENT_LIMITS.localesPerDocument, 'too_many');
}

// Same definition as pickTranslation (src/lib/i18n/content.ts), which treats these as missing.
function isBlank(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  return Array.isArray(value) && value.length === 0;
}

/**
 * Reports every field of `fields` that is blank in `translations[defaultLocale]`. Editors
 * must fill the default language completely; other languages fall back to it field by field.
 */
export function addMissingDefaultLocale(
  ctx: z.core.$RefinementCtx,
  translations: Record<string, object | undefined> | undefined,
  defaultLocale: string | undefined,
  fields: readonly string[],
  basePath: PropertyKey[] = ['translations'],
): void {
  if (translations === undefined || defaultLocale === undefined) return;
  const entry = translations[defaultLocale] as Record<string, unknown> | undefined;
  for (const field of fields) {
    if (isBlank(entry?.[field])) {
      ctx.addIssue({
        code: 'custom',
        message: 'default_locale_required',
        path: [...basePath, defaultLocale, field],
      });
    }
  }
}

export interface TranslatedFields {
  defaultLocale?: string;
  translations?: Record<string, object | undefined>;
}

/** superRefine for an object with `defaultLocale` and `translations` side by side. */
export function requireDefaultLocale(fields: readonly string[]) {
  return (value: TranslatedFields, ctx: z.core.$RefinementCtx): void =>
    addMissingDefaultLocale(ctx, value.translations, value.defaultLocale, fields);
}

/**
 * For patches: `translations` and `defaultLocale` must be sent together, or the rule above
 * could not be checked without the stored document.
 */
export function checkTranslationsPatch(fields: readonly string[]) {
  return (value: TranslatedFields, ctx: z.core.$RefinementCtx): void => {
    if ((value.translations === undefined) !== (value.defaultLocale === undefined)) {
      const missing = value.translations === undefined ? 'translations' : 'defaultLocale';
      ctx.addIssue({ code: 'custom', message: 'required', path: [missing] });
      return;
    }
    addMissingDefaultLocale(ctx, value.translations, value.defaultLocale, fields);
  };
}

// --- Actions without a payload -----------------------------------------------------------------

/** For actions that take no input (sign out, client auth token). */
export const noInputSchema = z.undefined({ error: 'invalid' });
