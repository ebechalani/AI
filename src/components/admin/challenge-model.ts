import { XP_RULES } from '@/lib/gamification/rules';
import { LOCALES } from '@/lib/i18n/config';
import { pickTranslation } from '@/lib/i18n/content';
import type { Challenge, ChallengeScope, ChallengeStatus, ChallengeType } from '@/types/challenge';
import type { IsoDateString, LearningArea, Locale, SubmissionType } from '@/types/common';
import type { HardwareCapability } from '@/types/hardware';
import type { ChallengeInput } from '@/types/inputs';
import { RUBRIC_KEYS, type RubricKey, type RubricWeight } from '@/types/project';
import { isoToLocalInput, localInputToIso } from './dates';
import { numberInput } from './field-errors';
import { MAIN_CONTENT_ID } from './focus';

// The challenge editor, the status transitions and the list filters as pure functions, shared
// by the components, the pages and the unit tests.

const HOUR = 60 * 60 * 1000;
const WEEK = 7 * 24 * HOUR;

/** The four criteria at 25 each. */
export const DEFAULT_RUBRIC: RubricWeight[] = RUBRIC_KEYS.map((key) => ({ key, weight: 25 }));

export interface ChallengeTextValues {
  title: string;
  description: string;
  submissionRequirements: string;
  prizes: string;
}

export interface ChallengeFormValues {
  type: ChallengeType;
  scope: ChallengeScope;
  /** '' = none picked. */
  schoolId: string;
  area: LearningArea;
  ageMin: string;
  ageMax: string;
  /** datetime-local values. */
  startAt: string;
  deadlineAt: string;
  allowedSubmissionTypes: SubmissionType[];
  rubric: Record<RubricKey, { enabled: boolean; weight: string }>;
  xpReward: string;
  coverImageFileId: string | null;
  hardwarePlatformIds: string[];
  requiredCapabilities: HardwareCapability[];
  defaultLocale: Locale;
  /** One entry per LOCALES item, plus any other locale the stored challenge holds. */
  translations: Record<string, ChallengeTextValues>;
}

const BLANK_TEXT: ChallengeTextValues = {
  title: '',
  description: '',
  submissionRequirements: '',
  prizes: '',
};

function blankTranslations(): Record<string, ChallengeTextValues> {
  const translations: Record<string, ChallengeTextValues> = {};
  for (const locale of LOCALES) translations[locale] = { ...BLANK_TEXT };
  return translations;
}

/**
 * A new challenge: weekly, for every student, AI, no ages, opening at the next full hour after
 * `now` for a week, text entries, the default rubric, the default XP, no cover, no hardware,
 * the page's language as default, blank texts in every language.
 */
export function emptyChallenge(
  now: IsoDateString,
  timeZone: string,
  locale: Locale,
): ChallengeFormValues {
  const start = Math.floor(Date.parse(now) / HOUR) * HOUR + HOUR;
  const rubric = {} as Record<RubricKey, { enabled: boolean; weight: string }>;
  for (const { key, weight } of DEFAULT_RUBRIC) rubric[key] = { enabled: true, weight: String(weight) };
  return {
    type: 'weekly',
    scope: 'global',
    schoolId: '',
    area: 'ai',
    ageMin: '',
    ageMax: '',
    startAt: isoToLocalInput(new Date(start).toISOString(), timeZone),
    deadlineAt: isoToLocalInput(new Date(start + WEEK).toISOString(), timeZone),
    allowedSubmissionTypes: ['text'],
    rubric,
    xpReward: String(XP_RULES.challenge),
    coverImageFileId: null,
    hardwarePlatformIds: [],
    requiredCapabilities: [],
    defaultLocale: locale,
    translations: blankTranslations(),
  };
}

/** A stored challenge; null prizes → ''; locales not in LOCALES are kept (sent back unchanged). */
export function challengeValues(challenge: Challenge, timeZone: string): ChallengeFormValues {
  const rubric = {} as Record<RubricKey, { enabled: boolean; weight: string }>;
  for (const key of RUBRIC_KEYS) {
    const stored = challenge.rubric.find((entry) => entry.key === key);
    rubric[key] = stored ? { enabled: true, weight: String(stored.weight) } : { enabled: false, weight: '' };
  }
  const translations = blankTranslations();
  for (const [locale, entry] of Object.entries(challenge.translations)) {
    if (entry === undefined) continue;
    translations[locale] = {
      title: entry.title ?? '',
      description: entry.description ?? '',
      submissionRequirements: entry.submissionRequirements ?? '',
      prizes: entry.prizes ?? '',
    };
  }
  return {
    type: challenge.type,
    scope: challenge.scope,
    schoolId: challenge.schoolId ?? '',
    area: challenge.area,
    ageMin: challenge.ageMin === null ? '' : String(challenge.ageMin),
    ageMax: challenge.ageMax === null ? '' : String(challenge.ageMax),
    startAt: isoToLocalInput(challenge.startAt, timeZone),
    deadlineAt: isoToLocalInput(challenge.deadlineAt, timeZone),
    allowedSubmissionTypes: [...challenge.allowedSubmissionTypes],
    rubric,
    xpReward: String(challenge.xpReward),
    coverImageFileId: challenge.coverImage?.fileId ?? null,
    hardwarePlatformIds: [...challenge.hardwarePlatformIds],
    requiredCapabilities: [...challenge.requiredCapabilities],
    defaultLocale: challenge.defaultLocale,
    translations,
  };
}

const isBlankText = (text: ChallengeTextValues): boolean =>
  Object.values(text).every((value) => value.trim() === '');

/**
 * The ChallengeInput of the form: ages '' → null else numberInput; xpReward numberInput (''
 * → NaN → invalid_number, never 0); dates localInputToIso ?? '' (→ invalid_date); schoolId only
 * for scope school; the enabled criteria in RUBRIC_KEYS order with numberInput(weight); texts
 * trimmed, prizes '' → null; a locale whose four texts are blank is left out, except the
 * default locale (always sent, so the schema reports default_locale_required).
 */
export function challengePayload(values: ChallengeFormValues, timeZone: string): ChallengeInput {
  const translations: ChallengeInput['translations'] = {};
  for (const [locale, text] of Object.entries(values.translations)) {
    if (locale !== values.defaultLocale && isBlankText(text)) continue;
    const prizes = text.prizes.trim();
    translations[locale] = {
      title: text.title.trim(),
      description: text.description.trim(),
      submissionRequirements: text.submissionRequirements.trim(),
      prizes: prizes === '' ? null : prizes,
    };
  }
  if (translations[values.defaultLocale] === undefined) {
    translations[values.defaultLocale] = {
      title: '',
      description: '',
      submissionRequirements: '',
      prizes: null,
    };
  }
  const age = (value: string): number | null => (value.trim() === '' ? null : numberInput(value));
  return {
    type: values.type,
    scope: values.scope,
    schoolId: values.scope === 'school' ? values.schoolId || null : null,
    area: values.area,
    ageMin: age(values.ageMin),
    ageMax: age(values.ageMax),
    startAt: localInputToIso(values.startAt, timeZone) ?? '',
    deadlineAt: localInputToIso(values.deadlineAt, timeZone) ?? '',
    allowedSubmissionTypes: [...values.allowedSubmissionTypes],
    rubric: RUBRIC_KEYS.filter((key) => values.rubric[key].enabled).map((key) => ({
      key,
      weight: numberInput(values.rubric[key].weight),
    })),
    xpReward: numberInput(values.xpReward),
    coverImageFileId: values.coverImageFileId,
    hardwarePlatformIds: [...values.hardwarePlatformIds],
    requiredCapabilities: [...values.requiredCapabilities],
    defaultLocale: values.defaultLocale,
    translations,
  };
}

/** Σ of the enabled weights; a blank or unreadable weight counts 0. */
export function rubricTotal(values: Pick<ChallengeFormValues, 'rubric'>): number {
  return RUBRIC_KEYS.filter((key) => values.rubric[key].enabled).reduce((sum, key) => {
    const weight = numberInput(values.rubric[key].weight);
    return sum + (Number.isNaN(weight) ? 0 : weight);
  }, 0);
}

export type ChallengeTransition = 'publish' | 'unpublish' | 'archive' | 'restore';

/** draft → publish, archive; published → unpublish, archive; archived → restore. */
export function challengeTransitions(status: ChallengeStatus): ChallengeTransition[] {
  switch (status) {
    case 'draft':
      return ['publish', 'archive'];
    case 'published':
      return ['unpublish', 'archive'];
    case 'archived':
      return ['restore'];
  }
}

export function transitionTarget(transition: ChallengeTransition): ChallengeStatus {
  switch (transition) {
    case 'publish':
      return 'published';
    case 'archive':
      return 'archived';
    case 'unpublish':
    case 'restore':
      return 'draft';
  }
}

/** publish, unpublish and archive are confirmed in a dialog; restore is not. */
export function transitionNeedsConfirm(transition: ChallengeTransition): boolean {
  return transition !== 'restore';
}

/** unpublish and archive take the danger variant. */
export function isDestructiveTransition(transition: ChallengeTransition): boolean {
  return transition === 'unpublish' || transition === 'archive';
}

export type StatusFilter = 'all' | ChallengeStatus;

export const STATUS_FILTERS: readonly StatusFilter[] = ['all', 'draft', 'published', 'archived'];

/**
 * Where the focus goes once a transition succeeds. On the list with a status filter, a
 * challenge whose new status the filter hides leaves the table with the refresh: `rowFocusId`
 * would be gone, so the main content. The edit page passes 'all' (its status card heading
 * always stays).
 */
export function focusAfterTransition(
  filter: StatusFilter,
  transition: ChallengeTransition,
  rowFocusId: string,
): string {
  return filter === 'all' || filter === transitionTarget(transition) ? rowFocusId : MAIN_CONTENT_ID;
}

export function parseStatusFilter(raw: string | undefined): StatusFilter {
  return raw !== undefined && (STATUS_FILTERS as readonly string[]).includes(raw)
    ? (raw as StatusFilter)
    : 'all';
}

export function filterChallenges(
  challenges: readonly Challenge[],
  filter: StatusFilter,
): Challenge[] {
  return challenges.filter((challenge) => filter === 'all' || challenge.status === filter);
}

/** The title for `locale`, or null when blank everywhere. */
export function challengeTitle(
  challenge: Pick<Challenge, 'translations' | 'defaultLocale'>,
  locale: string,
): string | null {
  const title = pickTranslation(challenge.translations, locale, challenge.defaultLocale).title;
  return typeof title === 'string' && title.trim() !== '' ? title : null;
}

const TRANSLATION_PATH = /^translations\.([^.]+)\.(title|description|submissionRequirements|prizes)$/;

/** The locale of the first `translations.<locale>.<field>` path in `paths`, or null. */
export function firstErrorLocale(paths: readonly string[]): string | null {
  for (const path of paths) {
    const match = TRANSLATION_PATH.exec(path);
    if (match !== null) return match[1]!;
  }
  return null;
}

const TOP_LEVEL_FIELDS: readonly (keyof ChallengeInput)[] = [
  'type',
  'scope',
  'schoolId',
  'area',
  'ageMin',
  'ageMax',
  'startAt',
  'deadlineAt',
  'allowedSubmissionTypes',
  'rubric',
  'xpReward',
  'coverImageFileId',
  'hardwarePlatformIds',
  'requiredCapabilities',
  'defaultLocale',
];

/** The paths the challenge form shows next to a field: every top-level field (and what is under it), and the texts of a locale. */
export function claimsChallengePath(path: string): boolean {
  const head = path.split('.')[0] ?? '';
  if ((TOP_LEVEL_FIELDS as readonly string[]).includes(head)) return true;
  return TRANSLATION_PATH.test(path);
}
