'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { updateLessonAction } from '@/actions/course-editor';
import { Card, CardTitle, useToast } from '@/components/ui';
import { CONTENT_LIMITS } from '@/lib/limits';
import { updateLessonInputSchema } from '@/lib/schemas/course';
import { parseInput } from '@/lib/schemas/common';
import type { Locale } from '@/types/common';
import { ConflictAlert } from './ConflictAlert';
import { useEditorEvents } from './editor-events';
import { FormActions } from './FormActions';
import { FormAlert } from './FormAlert';
import { LanguageSwitch } from './LanguageSwitch';
import { lessonPatch, lessonToDraft, type LessonTextField } from './module-lesson-model';
import { NumberField } from './NumberField';
import type { LessonRow } from './rows';
import { focusSyncNotice } from './SyncNotice';
import { TextField } from './TextField';
import { stripInputPrefix, translationStates } from './translations';
import { useEditorAction } from './use-editor-action';
import { useFormErrors } from './use-form-errors';
import { useServerSync } from './use-server-sync';
import { useRegisterDirty } from './unsaved-changes';

const ORDER = ['defaultLocale', 'translations', 'estimatedMinutes', 'xpReward'];
const SHOWN = /^(translations\.[a-z]+\.(title|summary)|estimatedMinutes|xpReward)$/;

export interface LessonDetailsFormProps {
  courseId: string;
  lesson: LessonRow;
}

/** The lesson's title, summary, time and XP (6.3.1). */
export function LessonDetailsForm({ courseId, lesson }: LessonDetailsFormProps) {
  const t = useTranslations('courseEditor');
  const { toast } = useToast();
  const { run, refresh, refreshing } = useEditorAction();
  const events = useEditorEvents();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const conflictRef = useRef<HTMLDivElement>(null);
  const sync = useServerSync(lessonToDraft(lesson), { refreshing });
  const { draft, base, dirty, conflict } = sync;
  const [language, setLanguage] = useState<Locale>(draft.defaultLocale);
  const [pending, setPending] = useState(false);
  useRegisterDirty('lesson-details', dirty);
  const errors = useFormErrors({
    formRef,
    alertRef,
    language,
    setLanguage,
    order: ORDER,
    isShown: (path) => SHOWN.test(path),
  });
  const required = language === draft.defaultLocale;

  function setText(field: LessonTextField, value: string) {
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
    const patch = lessonPatch(base, draft);
    if (Object.keys(patch).length === 0) {
      toast({ tone: 'info', title: t('details.nothingToSave') });
      return;
    }
    const parsed = parseInput(updateLessonInputSchema, { courseId, lessonId: lesson.id, patch });
    if (!parsed.success) {
      errors.show(stripInputPrefix(parsed.fieldErrors));
      return;
    }
    errors.clear();
    setPending(true);
    const result = await run(
      () => updateLessonAction({ courseId, lessonId: lesson.id, patch }),
      { report: errors.fail, onFieldErrors: errors.show },
    );
    setPending(false);
    if (!result.ok) return;
    sync.markSaved();
    toast({ tone: 'success', title: t('lessonDetails.saved') });
    refresh();
  }

  return (
    <Card className="gap-4 p-5 sm:p-6">
      <CardTitle as="h2" className="text-lg font-bold">
        {t('lessonDetails.title')}
      </CardTitle>
      <form
        id={formId}
        ref={formRef}
        noValidate
        onSubmit={onSubmit}
        className="flex min-w-0 flex-col gap-5"
      >
        {conflict && (
          <ConflictAlert ref={conflictRef} onTakeTheirs={sync.takeTheirs} onKeepMine={sync.keepMine} />
        )}
        <LanguageSwitch
          name={`${formId}-language`}
          value={language}
          onChange={setLanguage}
          defaultLocale={draft.defaultLocale}
          states={translationStates(draft.text, draft.defaultLocale)}
          disabled={pending}
        />
        <TextField
          label={t('fields.title')}
          locale={language}
          value={draft.text[language].title}
          onChange={(value) => setText('title', value)}
          required={required}
          max={CONTENT_LIMITS.titleChars}
          error={errors.errorFor(`translations.${language}.title`)}
          disabled={pending}
        />
        <TextField
          label={t('fields.lessonSummary')}
          locale={language}
          value={draft.text[language].summary}
          onChange={(value) => setText('summary', value)}
          required={required}
          multiline
          rows={2}
          max={CONTENT_LIMITS.summaryChars}
          error={errors.errorFor(`translations.${language}.summary`)}
          disabled={pending}
        />
        <NumberField
          label={t('fields.lessonMinutes')}
          value={draft.estimatedMinutes}
          onChange={(estimatedMinutes) => sync.setDraft((c) => ({ ...c, estimatedMinutes }))}
          min={1}
          max={CONTENT_LIMITS.lessonMinutesMax}
          required
          hint={t('fields.lessonMinutesHint', { max: CONTENT_LIMITS.lessonMinutesMax })}
          error={errors.errorFor('estimatedMinutes')}
          disabled={pending}
        />
        <NumberField
          label={t('fields.xp')}
          value={draft.xpReward}
          onChange={(xpReward) => sync.setDraft((c) => ({ ...c, xpReward }))}
          min={0}
          max={CONTENT_LIMITS.xpRewardMax.lesson}
          required
          hint={t('fields.lessonXpHint', { max: CONTENT_LIMITS.xpRewardMax.lesson })}
          error={errors.errorFor('xpReward')}
          disabled={pending}
        />
        <FormAlert ref={alertRef} failure={errors.failure}>
          {errors.otherLanguageNote && <p className="mt-1">{errors.otherLanguageNote}</p>}
        </FormAlert>
        <FormActions
          saveLabel={t('lessonDetails.save')}
          pending={pending}
          onDiscard={() => {
            sync.discard();
            errors.clear();
          }}
          discardLabel={t('details.discard')}
          discardDisabled={!dirty}
        />
      </form>
    </Card>
  );
}
