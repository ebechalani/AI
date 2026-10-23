'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { createLessonAction } from '@/actions/course-editor';
import { Button, Dialog, useToast } from '@/components/ui';
import { CONTENT_LIMITS } from '@/lib/limits';
import { lessonInputSchema } from '@/lib/schemas/course';
import { parseInput } from '@/lib/schemas/common';
import type { Locale } from '@/types/common';
import { DIALOG_TEXT } from './dialog';
import { FormAlert } from './FormAlert';
import { LanguageSwitch } from './LanguageSwitch';
import { lessonDraftToInput, newLessonDraft, type LessonDraft } from './module-lesson-model';
import { NumberField } from './NumberField';
import { TextField } from './TextField';
import { translationStates } from './translations';
import { useEditorAction } from './use-editor-action';
import { useFormErrors } from './use-form-errors';

const ORDER = ['defaultLocale', 'translations', 'estimatedMinutes', 'xpReward'];
const SHOWN = /^(translations\.[a-z]+\.(title|summary)|estimatedMinutes|xpReward)$/;

export interface LessonDialogProps {
  open: boolean;
  onClose(): void;
  courseId: string;
  moduleId: string;
  moduleTitle: string;
  /** The course's language: the new lesson's default language. */
  defaultLocale: Locale;
  /** After the lesson exists (the owner closes the dialog, refreshes and moves the focus). */
  onCreated(lessonId: string): void;
}

/** Creates a lesson in a module (6.2.3). Mounted afresh at every opening. */
export function LessonDialog({
  open,
  onClose,
  courseId,
  moduleId,
  moduleTitle,
  defaultLocale,
  onCreated,
}: LessonDialogProps) {
  const t = useTranslations('courseEditor');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const { run } = useEditorAction();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<LessonDraft>(() => newLessonDraft(defaultLocale));
  const [language, setLanguage] = useState<Locale>(defaultLocale);
  const [pending, setPending] = useState(false);
  const errors = useFormErrors({
    formRef,
    alertRef,
    language,
    setLanguage,
    order: ORDER,
    isShown: (path) => SHOWN.test(path),
  });
  const required = language === draft.defaultLocale;

  function setText(field: 'title' | 'summary', value: string) {
    setDraft((current) => ({
      ...current,
      text: { ...current.text, [language]: { ...current.text[language], [field]: value } },
    }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const input = lessonDraftToInput(draft);
    const parsed = parseInput(lessonInputSchema, input);
    if (!parsed.success) {
      errors.show(parsed.fieldErrors);
      return;
    }
    errors.clear();
    setPending(true);
    const result = await run(() => createLessonAction({ courseId, moduleId, input }), {
      context: { action: 'createLesson' },
      report: errors.fail,
      onFieldErrors: errors.show,
    });
    setPending(false);
    if (!result.ok) {
      if (result.error.code === 'not_found') onClose();
      return;
    }
    toast({ tone: 'success', title: t('lesson.created') });
    onCreated(result.data.lessonId);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('lesson.createTitle', { module: moduleTitle })}
      size="md"
      className={DIALOG_TEXT}
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {tCommon('actions.cancel')}
          </Button>
          <Button type="submit" form={formId} loading={pending}>
            {tCommon('actions.save')}
          </Button>
        </>
      }
    >
      <form id={formId} ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
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
          autoFocus
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
          onChange={(value) => setDraft((current) => ({ ...current, estimatedMinutes: value }))}
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
          onChange={(value) => setDraft((current) => ({ ...current, xpReward: value }))}
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
      </form>
    </Dialog>
  );
}
