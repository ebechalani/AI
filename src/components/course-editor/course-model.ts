import type { Audience, LearningArea, Locale, Localized } from '@/types/common';
import type { AccessTier, Course, Lesson } from '@/types/content';
import type { HardwareCapability } from '@/types/hardware';
import type { CourseInput } from '@/types/inputs';
import type { EditorMode } from './paths';
import type { PathwayOption } from './rows';
import { stableKey } from './sync-model';
import { extraLocales, textDraftFrom, textDraftTo, type TextDraft } from './translations';

// The course details form's draft (6.2.4) and the new-course dialog's values (6.1).

export type CourseTextField = 'title' | 'summary' | 'description' | 'outcomes';
export const COURSE_TEXT_FIELDS: readonly CourseTextField[] = [
  'title',
  'summary',
  'description',
  'outcomes',
];

export interface CourseDraft {
  defaultLocale: Locale;
  /** `outcomes`: one per line. */
  text: TextDraft<CourseTextField>;
  /** Translations outside the editable locales, kept. */
  extra: Localized<unknown>;
  audience: Audience;
  area: LearningArea;
  /** Comma-separated, as typed. */
  tags: string;
  /** '' = none. */
  ageMin: string;
  ageMax: string;
  estimatedMinutes: string;
  /** An official course's 'public' reads as 'private' and is never sent. */
  visibility: 'private' | 'school';
  certificateEnabled: boolean;
  hardwarePlatformIds: string[];
  requiredCapabilities: HardwareCapability[];
  /** '' = none; official courses only. */
  pathwayId: string;
  /** Official courses only. */
  order: string;
  accessTier: AccessTier;
}

function numberText(value: number | null): string {
  return value === null ? '' : String(value);
}

/** Split on line breaks, trimmed, blank lines dropped, order kept. */
export function linesToList(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

/** Split on commas, trimmed, blanks dropped (the schema lower-cases). */
export function tagsFromText(text: string): string[] {
  return text
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag !== '');
}

/** '' → null, else Number(text): NaN stays, and the schema answers `invalid_number`. */
export function numberOrNull(text: string): number | null {
  return text.trim() === '' ? null : Number(text);
}

/**
 * A number field's value for an input whose type has no null: an empty field becomes null and
 * the schema answers `required` instead of a silent 0.
 */
export function requiredNumber(text: string): number {
  return numberOrNull(text) as number;
}

export function courseToDraft(course: Course): CourseDraft {
  const plain: Localized<Partial<Record<CourseTextField, string>>> = {};
  for (const [locale, entry] of Object.entries(course.translations)) {
    if (entry === undefined) continue;
    plain[locale] = { ...entry, outcomes: entry.outcomes.join('\n') };
  }
  return {
    defaultLocale: course.defaultLocale,
    text: textDraftFrom(plain, COURSE_TEXT_FIELDS),
    extra: extraLocales(course.translations),
    audience: course.audience,
    area: course.area,
    tags: course.tags.join(', '),
    ageMin: numberText(course.ageMin),
    ageMax: numberText(course.ageMax),
    estimatedMinutes: String(course.estimatedMinutes),
    visibility: course.visibility === 'school' ? 'school' : 'private',
    certificateEnabled: course.certificateEnabled,
    hardwarePlatformIds: course.hardwarePlatformIds,
    requiredCapabilities: course.requiredCapabilities,
    pathwayId: course.pathwayId ?? '',
    order: String(course.order),
    accessTier: course.accessTier,
  };
}

/** The draft's text as `CourseInput.translations`. */
export function courseTranslations(draft: CourseDraft): CourseInput['translations'] {
  const flat = textDraftTo(draft.text, {
    fields: COURSE_TEXT_FIELDS,
    defaultLocale: draft.defaultLocale,
  });
  const translations: CourseInput['translations'] = {};
  for (const [locale, entry] of Object.entries(flat)) {
    if (entry === undefined) continue;
    translations[locale] = {
      title: entry.title ?? '',
      summary: entry.summary ?? '',
      description: entry.description ?? '',
      outcomes: linesToList(entry.outcomes ?? ''),
    };
  }
  for (const [locale, entry] of Object.entries(draft.extra)) {
    if (entry !== undefined) translations[locale] = entry as CourseInput['translations'][string];
  }
  return translations;
}

function changed<T>(a: T, b: T): boolean {
  return stableKey(a) !== stableKey(b);
}

/**
 * Only what changed; `{}` = nothing to save. Text or default language changed → both travel
 * together. Ages travel together; a course for teachers sends both as null. `visibility` only
 * for a teacher-made course; the pathway, position and access only for an admin on an official
 * course.
 */
export function coursePatch(
  base: CourseDraft,
  draft: CourseDraft,
  options: { admin: boolean; official: boolean },
): Partial<CourseInput> {
  const patch: Partial<CourseInput> = {};
  if (base.defaultLocale !== draft.defaultLocale || changed(base.text, draft.text)) {
    patch.defaultLocale = draft.defaultLocale;
    patch.translations = courseTranslations(draft);
  }
  if (base.audience !== draft.audience) patch.audience = draft.audience;
  if (base.area !== draft.area) patch.area = draft.area;
  if (base.tags !== draft.tags) patch.tags = tagsFromText(draft.tags);
  const teacherCourse = draft.audience === 'teacher';
  const agesChanged = base.ageMin !== draft.ageMin || base.ageMax !== draft.ageMax;
  if (agesChanged || (teacherCourse && base.audience !== 'teacher')) {
    patch.ageMin = teacherCourse ? null : numberOrNull(draft.ageMin);
    patch.ageMax = teacherCourse ? null : numberOrNull(draft.ageMax);
  }
  if (base.estimatedMinutes !== draft.estimatedMinutes) {
    patch.estimatedMinutes = requiredNumber(draft.estimatedMinutes);
  }
  if (!options.official && base.visibility !== draft.visibility) {
    patch.visibility = draft.visibility;
  }
  if (base.certificateEnabled !== draft.certificateEnabled) {
    patch.certificateEnabled = draft.certificateEnabled;
  }
  if (changed(base.hardwarePlatformIds, draft.hardwarePlatformIds)) {
    patch.hardwarePlatformIds = draft.hardwarePlatformIds;
  }
  if (changed(base.requiredCapabilities, draft.requiredCapabilities)) {
    patch.requiredCapabilities = draft.requiredCapabilities;
  }
  if (options.admin && options.official) {
    if (base.pathwayId !== draft.pathwayId) patch.pathwayId = draft.pathwayId || null;
    if (base.order !== draft.order) patch.order = requiredNumber(draft.order);
    if (base.accessTier !== draft.accessTier) patch.accessTier = draft.accessTier;
  }
  return patch;
}

export interface NewCourseValues {
  defaultLocale: Locale;
  title: string;
  summary: string;
  description: string;
  audience: Audience;
  area: LearningArea;
  // Admin only.
  pathwayId: string;
  order: string;
  accessTier: AccessTier;
}

/** The new-course dialog starts in the UI language, for students, about AI. */
export function newCourseValues(locale: Locale): NewCourseValues {
  return {
    defaultLocale: locale,
    title: '',
    summary: '',
    description: '',
    audience: 'student',
    area: 'ai',
    pathwayId: '',
    order: '',
    accessTier: 'free',
  };
}

export const NEW_COURSE_MINUTES = 60;

export function newCourseInput(values: NewCourseValues, mode: EditorMode): CourseInput {
  const input: CourseInput = {
    defaultLocale: values.defaultLocale,
    translations: {
      [values.defaultLocale]: {
        title: values.title,
        summary: values.summary,
        description: values.description,
        outcomes: [],
      },
    },
    audience: values.audience,
    area: values.area,
    tags: [],
    ageMin: null,
    ageMax: null,
    estimatedMinutes: NEW_COURSE_MINUTES,
    visibility: 'private',
    certificateEnabled: true,
    coverImageFileId: null,
    hardwarePlatformIds: [],
    requiredCapabilities: [],
  };
  if (mode === 'admin') {
    input.isOfficial = true;
    input.pathwayId = values.pathwayId || null;
    input.order = requiredNumber(values.order);
    input.accessTier = values.accessTier;
  }
  return input;
}

/** 1 + the highest position among the courses of that pathway; 1 when it has none. */
export function nextOrderInPathway(
  courses: readonly Pick<Course, 'pathwayId' | 'order'>[],
  pathwayId: string | null,
): number {
  const orders = courses
    .filter((course) => course.pathwayId === pathwayId)
    .map((course) => course.order);
  return orders.length === 0 ? 1 : Math.max(...orders) + 1;
}

/** Which `conflict` an update of the course details meant (3.2). */
export function courseConflictReason(
  patch: Partial<CourseInput>,
  course: Course,
  lessons: readonly Pick<Lesson, 'projectIds'>[],
): 'pathwayLocked' | 'audienceHasProjects' | 'generic' {
  const movesPathway =
    (patch.pathwayId !== undefined && patch.pathwayId !== course.pathwayId) ||
    (patch.isOfficial !== undefined && patch.isOfficial !== course.isOfficial);
  if (movesPathway && course.status === 'published') return 'pathwayLocked';
  if (patch.audience === 'teacher' && lessons.some((lesson) => lesson.projectIds.length > 0)) {
    return 'audienceHasProjects';
  }
  return 'generic';
}

/** '' (no pathway) → true; else the pathway exists and serves that audience (Q13). */
export function pathwayFitsAudience(
  pathwayId: string,
  audience: Audience,
  pathways: readonly Pick<PathwayOption, 'id' | 'audience'>[],
): boolean {
  if (pathwayId === '') return true;
  return pathways.some((pathway) => pathway.id === pathwayId && pathway.audience === audience);
}
