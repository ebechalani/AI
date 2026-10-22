'use client';

import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { updateCourseAction } from '@/actions/course-editor';
import { FormField, Select, useToast } from '@/components/ui';
import { LOCALE_LABELS } from '@/lib/i18n/config';
import { CONTENT_LIMITS } from '@/lib/limits';
import { updateCourseInputSchema } from '@/lib/schemas/course';
import { parseInput } from '@/lib/schemas/common';
import type { Locale } from '@/types/common';
import type { Course, Lesson } from '@/types/content';
import { ConflictAlert } from './ConflictAlert';
import {
  courseConflictReason,
  coursePatch,
  courseToDraft,
  type CourseDraft,
  type CourseTextField,
} from './course-model';
import { CourseSettingsFields } from './CourseSettingsFields';
import { CourseTextFields } from './CourseTextFields';
import { useEditorEvents } from './editor-events';
import { FormActions } from './FormActions';
import { FormAlert } from './FormAlert';
import { HardwareFields } from './HardwareFields';
import { LanguageSwitch } from './LanguageSwitch';
import { OfficialFields } from './OfficialFields';
import { DETAILS_ANCHOR, type EditorMode } from './paths';
import type { PathwayOption, PlatformOption } from './rows';
import { focusSyncNotice } from './SyncNotice';
import {
  EDITABLE_LOCALES,
  isEditableLocale,
  stripInputPrefix,
  translationStates,
} from './translations';
import { useEditorAction } from './use-editor-action';
import { useFormErrors } from './use-form-errors';
import { useServerSync } from './use-server-sync';
import { useRegisterDirty } from './unsaved-changes';

const ORDER = [
  'defaultLocale',
  'translations',
  'audience',
  'area',
  'ageMin',
  'ageMax',
  'estimatedMinutes',
  'tags',
  'visibility',
  'certificateEnabled',
  'hardwarePlatformIds',
  'requiredCapabilities',
  'pathwayId',
  'order',
  'accessTier',
];
const LOCALES_PATTERN = EDITABLE_LOCALES.join('|');
const TEXT_PATH = new RegExp(
  `^translations\\.(${LOCALES_PATTERN})\\.(title|summary|description|outcomes(\\.\\d+)?)$`,
);
const PLAIN_PATH =
  /^(defaultLocale|audience|area|tags(\.\d+)?|ageMin|ageMax|estimatedMinutes|certificateEnabled|hardwarePlatformIds(\.\d+)?|requiredCapabilities(\.\d+)?)$/;
const OFFICIAL_PATH = /^(pathwayId|order|accessTier)$/;

export interface CourseDetailsFormProps {
  course: Course;
  mode: EditorMode;
  admin: boolean;
  hasProjectBlocks: boolean;
  lessons: Pick<Lesson, 'projectIds'>[];
  platforms: PlatformOption[];
  pathways: PathwayOption[];
}

function Fieldset({ legend, hint, children }: { legend: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-5">
      <legend className="mb-1 text-lg font-bold text-ink">{legend}</legend>
      {hint && <p className="-mt-3 text-sm text-ink-muted">{hint}</p>}
      {children}
    </fieldset>
  );
}

/** The course's details (6.2.4): texts in every language, settings, hardware, catalog fields. */
export function CourseDetailsForm({
  course,
  admin,
  hasProjectBlocks,
  lessons,
  platforms,
  pathways,
}: CourseDetailsFormProps) {
  const t = useTranslations('courseEditor');
  const { toast } = useToast();
  const { run, refresh, refreshing } = useEditorAction();
  const events = useEditorEvents();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const conflictRef = useRef<HTMLDivElement>(null);
  const official = course.isOfficial;
  const sync = useServerSync(courseToDraft(course), { refreshing });
  const { draft, base, dirty, conflict } = sync;
  const [language, setLanguage] = useState<Locale>(draft.defaultLocale);
  const [pending, setPending] = useState(false);
  useRegisterDirty('course-details', dirty);
  const errors = useFormErrors({
    formRef,
    alertRef,
    language,
    setLanguage,
    order: ORDER,
    isShown: (path) =>
      TEXT_PATH.test(path) ||
      PLAIN_PATH.test(path) ||
      (!official && path === 'visibility') ||
      (admin && official && OFFICIAL_PATH.test(path)),
    message: (key, path) =>
      /^tags(\.\d+)?$/.test(path) && key === 'invalid'
        ? t('fields.tagInvalid', { max: CONTENT_LIMITS.tagChars })
        : undefined,
  });

  function set(patch: Partial<CourseDraft>) {
    sync.setDraft((current) => ({ ...current, ...patch }));
  }

  function setText(field: CourseTextField, value: string) {
    sync.setDraft((current) => ({
      ...current,
      text: { ...current.text, [language]: { ...current.text[language], [field]: value } },
    }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (events.pending) {
      focusSyncNotice();
      return;
    }
    if (conflict) {
      conflictRef.current?.focus();
      return;
    }
    const patch = coursePatch(base, draft, { admin, official });
    if (Object.keys(patch).length === 0) {
      toast({ tone: 'info', title: t('details.nothingToSave') });
      return;
    }
    const parsed = parseInput(updateCourseInputSchema, { courseId: course.id, patch });
    if (!parsed.success) {
      errors.show(stripInputPrefix(parsed.fieldErrors));
      return;
    }
    errors.clear();
    setPending(true);
    const result = await run(() => updateCourseAction({ courseId: course.id, patch }), {
      context: { action: 'updateCourse', reason: courseConflictReason(patch, course, lessons) },
      report: errors.fail,
      onFieldErrors: errors.show,
    });
    setPending(false);
    if (!result.ok) return;
    sync.markSaved();
    toast({ tone: 'success', title: t('details.saved') });
    refresh();
  }

  function discard() {
    sync.discard();
    errors.clear();
  }

  return (
    <form
      id="course-details-form"
      ref={formRef}
      noValidate
      onSubmit={onSubmit}
      className="flex min-w-0 flex-col gap-8"
    >
      <h2 id={DETAILS_ANCHOR} tabIndex={-1} className="rounded-sm text-xl font-bold text-ink">
        {t('details.heading')}
      </h2>
      {conflict && (
        <ConflictAlert ref={conflictRef} onTakeTheirs={sync.takeTheirs} onKeepMine={sync.keepMine} />
      )}
      <Fieldset legend={t('details.textLegend')}>
        <FormField
          label={t('fields.defaultLocale')}
          hint={t('fields.defaultLocaleHint')}
          error={errors.errorFor('defaultLocale')}
        >
          <Select
            value={draft.defaultLocale}
            disabled={pending}
            onChange={(event) => {
              if (isEditableLocale(event.target.value)) set({ defaultLocale: event.target.value });
            }}
            options={EDITABLE_LOCALES.map((locale) => ({
              value: locale,
              label: LOCALE_LABELS[locale],
            }))}
          />
        </FormField>
        <LanguageSwitch
          name={`${formId}-language`}
          value={language}
          onChange={setLanguage}
          defaultLocale={draft.defaultLocale}
          states={translationStates(draft.text, draft.defaultLocale)}
          disabled={pending}
        />
        <CourseTextFields
          language={language}
          required={language === draft.defaultLocale}
          text={draft.text[language]}
          onChange={setText}
          errorFor={errors.errorFor}
          errorUnder={errors.errorUnder}
          disabled={pending}
        />
      </Fieldset>
      <Fieldset legend={t('details.aboutLegend')}>
        <CourseSettingsFields
          draft={draft}
          set={set}
          course={course}
          official={official}
          admin={admin}
          hasProjectBlocks={hasProjectBlocks}
          pathways={pathways}
          errorFor={errors.errorFor}
          errorUnder={errors.errorUnder}
          disabled={pending}
          formId={formId}
        />
      </Fieldset>
      <Fieldset legend={t('details.hardwareLegend')} hint={t('details.hardwareHint')}>
        <HardwareFields
          platforms={platforms}
          platformIds={draft.hardwarePlatformIds}
          capabilities={draft.requiredCapabilities}
          onPlatformsChange={(hardwarePlatformIds) => set({ hardwarePlatformIds })}
          onCapabilitiesChange={(requiredCapabilities) => set({ requiredCapabilities })}
          platformsError={errors.errorUnder('hardwarePlatformIds')}
          capabilitiesError={errors.errorUnder('requiredCapabilities')}
          disabled={pending}
        />
      </Fieldset>
      {admin && official && (
        <Fieldset legend={t('details.officialLegend')}>
          <OfficialFields
            draft={draft}
            set={set}
            course={course}
            pathways={pathways}
            errorFor={errors.errorFor}
            disabled={pending}
            formId={formId}
          />
        </Fieldset>
      )}
      <FormAlert ref={alertRef} failure={errors.failure}>
        {errors.otherLanguageNote && <p className="mt-1">{errors.otherLanguageNote}</p>}
      </FormAlert>
      <FormActions
        saveLabel={t('details.save')}
        pending={pending}
        onDiscard={discard}
        discardLabel={t('details.discard')}
        discardDisabled={!dirty}
      />
    </form>
  );
}
