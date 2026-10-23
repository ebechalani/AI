import { XP_RULES } from '@/lib/gamification/rules';
import type { Locale, Localized } from '@/types/common';
import type { LessonInput, ModuleInput } from '@/types/inputs';
import { requiredNumber } from './course-model';
import type { LessonRow, ModuleRow } from './rows';
import { stableKey } from './sync-model';
import { extraLocales, textDraftFrom, textDraftTo, type TextDraft } from './translations';

// The module dialog and the lesson dialog / details form (6.2.3, 6.3.1).

export const MODULE_TEXT_FIELDS = ['title', 'description'] as const;
export type ModuleTextField = (typeof MODULE_TEXT_FIELDS)[number];

export interface ModuleDraft {
  defaultLocale: Locale;
  text: TextDraft<ModuleTextField>;
  extra: Localized<unknown>;
}

export function moduleToDraft(module: ModuleRow): ModuleDraft {
  return {
    defaultLocale: module.defaultLocale,
    text: textDraftFrom(module.translations, MODULE_TEXT_FIELDS),
    extra: extraLocales(module.translations),
  };
}

export function newModuleDraft(defaultLocale: Locale): ModuleDraft {
  return { defaultLocale, text: textDraftFrom({}, MODULE_TEXT_FIELDS), extra: {} };
}

/** Both fields are required in the default language; the same object is the update patch. */
export function moduleDraftToInput(draft: ModuleDraft): ModuleInput {
  return {
    defaultLocale: draft.defaultLocale,
    translations: textDraftTo(draft.text, {
      fields: MODULE_TEXT_FIELDS,
      defaultLocale: draft.defaultLocale,
      extra: draft.extra,
    }) as ModuleInput['translations'],
  };
}

export const LESSON_TEXT_FIELDS = ['title', 'summary'] as const;
export type LessonTextField = (typeof LESSON_TEXT_FIELDS)[number];

export interface LessonDraft {
  defaultLocale: Locale;
  text: TextDraft<LessonTextField>;
  extra: Localized<unknown>;
  estimatedMinutes: string;
  xpReward: string;
}

export const NEW_LESSON_MINUTES = 10;

export function lessonToDraft(lesson: LessonRow): LessonDraft {
  return {
    defaultLocale: lesson.defaultLocale,
    text: textDraftFrom(lesson.translations, LESSON_TEXT_FIELDS),
    extra: extraLocales(lesson.translations),
    estimatedMinutes: String(lesson.estimatedMinutes),
    xpReward: String(lesson.xpReward),
  };
}

export function newLessonDraft(defaultLocale: Locale): LessonDraft {
  return {
    defaultLocale,
    text: textDraftFrom({}, LESSON_TEXT_FIELDS),
    extra: {},
    estimatedMinutes: String(NEW_LESSON_MINUTES),
    xpReward: String(XP_RULES.lesson),
  };
}

function lessonTranslations(draft: LessonDraft): LessonInput['translations'] {
  return textDraftTo(draft.text, {
    fields: LESSON_TEXT_FIELDS,
    defaultLocale: draft.defaultLocale,
    extra: draft.extra,
  }) as LessonInput['translations'];
}

export function lessonDraftToInput(draft: LessonDraft): LessonInput {
  return {
    defaultLocale: draft.defaultLocale,
    translations: lessonTranslations(draft),
    estimatedMinutes: requiredNumber(draft.estimatedMinutes),
    xpReward: requiredNumber(draft.xpReward),
  };
}

/** The fields that changed; the text travels with the default language. `{}` = nothing. */
export function lessonPatch(base: LessonDraft, draft: LessonDraft): Partial<LessonInput> {
  const patch: Partial<LessonInput> = {};
  if (base.defaultLocale !== draft.defaultLocale || stableKey(base.text) !== stableKey(draft.text)) {
    patch.defaultLocale = draft.defaultLocale;
    patch.translations = lessonTranslations(draft);
  }
  if (base.estimatedMinutes !== draft.estimatedMinutes) {
    patch.estimatedMinutes = requiredNumber(draft.estimatedMinutes);
  }
  if (base.xpReward !== draft.xpReward) patch.xpReward = requiredNumber(draft.xpReward);
  return patch;
}
