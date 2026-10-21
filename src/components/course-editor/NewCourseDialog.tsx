'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { createCourseAction } from '@/actions/course-editor';
import { Button, Dialog, FormField, RadioGroup, Select, useToast } from '@/components/ui';
import { LOCALE_LABELS } from '@/lib/i18n/config';
import { useRouter } from '@/lib/i18n/navigation';
import { CONTENT_LIMITS } from '@/lib/limits';
import { courseInputSchema } from '@/lib/schemas/course';
import { parseInput } from '@/lib/schemas/common';
import { AUDIENCES, LEARNING_AREAS, type Audience, type LearningArea } from '@/types/common';
import { ACCESS_TIERS, type AccessTier, type Course } from '@/types/content';
import {
  newCourseInput,
  newCourseValues,
  nextOrderInPathway,
  pathwayFitsAudience,
  type NewCourseValues,
} from './course-model';
import { DIALOG_TEXT } from './dialog';
import { showErrorsAndFocus } from './focus';
import { FormAlert } from './FormAlert';
import { routeFieldErrors } from './form-errors';
import { NumberField } from './NumberField';
import { PathwaySelect } from './PathwaySelect';
import { editorPaths, type EditorMode } from './paths';
import type { PathwayOption } from './rows';
import { TextField } from './TextField';
import { EDITABLE_LOCALES, isEditableLocale } from './translations';
import { useValidationMessage } from './use-action-error';
import { useEditorAction, type FormFailure } from './use-editor-action';

type Field =
  | 'title'
  | 'summary'
  | 'description'
  | 'audience'
  | 'area'
  | 'pathwayId'
  | 'order'
  | 'accessTier';

const TEXT_FIELDS = ['title', 'summary', 'description'] as const;
const PLAIN_FIELDS: readonly Field[] = ['audience', 'area', 'pathwayId', 'order', 'accessTier'];

function fieldOf(path: string): Field | null {
  const parts = path.split('.');
  if (parts[0] === 'translations' && (TEXT_FIELDS as readonly string[]).includes(parts[2] ?? '')) {
    return parts[2] as Field;
  }
  return (PLAIN_FIELDS as readonly string[]).includes(path) ? (path as Field) : null;
}

export interface NewCourseDialogProps {
  open: boolean;
  onClose(): void;
  mode: EditorMode;
  pathways: readonly PathwayOption[];
  officialCourses: readonly Pick<Course, 'pathwayId' | 'order'>[];
}

/** Creates a course (a teacher's, or an official one) and opens its editor. */
export function NewCourseDialog({
  open,
  onClose,
  mode,
  pathways,
  officialCourses,
}: NewCourseDialogProps) {
  const t = useTranslations('courseEditor');
  const tCommon = useTranslations('common');
  const tDomain = useTranslations('domain');
  const uiLocale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const validationMessage = useValidationMessage();
  const { run } = useEditorAction();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<NewCourseValues>(() =>
    newCourseValues(isEditableLocale(uiLocale) ? uiLocale : 'en'),
  );
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [failure, setFailure] = useState<FormFailure | null>(null);
  const [pending, setPending] = useState(false);
  const admin = mode === 'admin';
  const defaultOrder = nextOrderInPathway(officialCourses, values.pathwayId || null);

  function set<K extends keyof NewCourseValues>(key: K, value: NewCourseValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function showFieldErrors(fieldErrors: Record<string, string[]>) {
    const routed = routeFieldErrors(fieldErrors, fieldOf, (key) => validationMessage(key));
    showErrorsAndFocus(
      () => {
        setErrors(routed.fields);
        setFailure(routed.unmatched.length > 0 ? { message: t('errors.form'), sessionEnded: false } : null);
      },
      formRef.current,
      () => alertRef.current,
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const input = newCourseInput(
      { ...values, order: values.order.trim() === '' ? String(defaultOrder) : values.order },
      mode,
    );
    const parsed = parseInput(courseInputSchema, input);
    if (!parsed.success) {
      showFieldErrors(parsed.fieldErrors);
      return;
    }
    setErrors({});
    setFailure(null);
    setPending(true);
    const result = await run(() => createCourseAction(input), {
      report: (next) =>
        showErrorsAndFocus(() => setFailure(next), null, () => alertRef.current),
      onFieldErrors: showFieldErrors,
    });
    setPending(false);
    if (!result.ok) return;
    toast({ tone: 'success', title: t('newCourse.created') });
    router.push(editorPaths(mode).course(result.data.courseId));
  }

  function chooseAudience(next: string) {
    const audience = next as Audience;
    setValues((current) => ({
      ...current,
      audience,
      pathwayId: pathwayFitsAudience(current.pathwayId, audience, pathways) ? current.pathwayId : '',
    }));
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={admin ? t('newCourse.adminTitle') : t('newCourse.title')}
      description={t('newCourse.description')}
      size="lg"
      className={DIALOG_TEXT}
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {tCommon('actions.cancel')}
          </Button>
          <Button type="submit" form={formId} loading={pending}>
            {t('newCourse.submit')}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        ref={formRef}
        noValidate
        onSubmit={onSubmit}
        className="flex flex-col gap-5"
      >
        <FormField label={t('fields.courseLanguage')} hint={t('newCourse.languageHint')}>
          <Select
            value={values.defaultLocale}
            disabled={pending}
            onChange={(event) => {
              if (isEditableLocale(event.target.value)) set('defaultLocale', event.target.value);
            }}
            options={EDITABLE_LOCALES.map((locale) => ({
              value: locale,
              label: LOCALE_LABELS[locale],
            }))}
          />
        </FormField>
        <TextField
          label={t('fields.title')}
          lang={values.defaultLocale}
          value={values.title}
          onChange={(value) => set('title', value)}
          required
          max={CONTENT_LIMITS.titleChars}
          error={errors.title}
          disabled={pending}
          autoFocus
        />
        <TextField
          label={t('fields.summary')}
          lang={values.defaultLocale}
          value={values.summary}
          onChange={(value) => set('summary', value)}
          required
          multiline
          rows={2}
          max={CONTENT_LIMITS.summaryChars}
          hint={t('fields.summaryHint')}
          error={errors.summary}
          disabled={pending}
        />
        <TextField
          label={t('fields.description')}
          lang={values.defaultLocale}
          value={values.description}
          onChange={(value) => set('description', value)}
          required
          multiline
          rows={4}
          max={CONTENT_LIMITS.descriptionChars}
          error={errors.description}
          disabled={pending}
        />
        <RadioGroup
          legend={t('fields.audience')}
          name={`${formId}-audience`}
          value={values.audience}
          onValueChange={chooseAudience}
          error={errors.audience}
          disabled={pending}
          options={AUDIENCES.map((audience) => ({
            value: audience,
            label: t(`fields.audienceOptions.${audience}`),
            description: t(`fields.audienceOptions.${audience}Description`),
          }))}
        />
        <FormField label={t('fields.area')} error={errors.area}>
          <Select
            value={values.area}
            disabled={pending}
            onChange={(event) => set('area', event.target.value as LearningArea)}
            options={LEARNING_AREAS.map((area) => ({ value: area, label: tDomain(`areas.${area}`) }))}
          />
        </FormField>
        {admin && (
          <>
            <PathwaySelect
              value={values.pathwayId}
              onChange={(value) => set('pathwayId', value)}
              audience={values.audience}
              pathways={pathways}
              error={errors.pathwayId}
              disabled={pending}
            />
            <NumberField
              label={t('fields.order')}
              value={values.order}
              onChange={(value) => set('order', value)}
              min={0}
              max={CONTENT_LIMITS.courseOrderMax}
              placeholder={String(defaultOrder)}
              hint={t('fields.orderHint', { max: CONTENT_LIMITS.courseOrderMax })}
              error={errors.order}
              disabled={pending}
            />
            <RadioGroup
              legend={t('fields.accessTier')}
              name={`${formId}-tier`}
              value={values.accessTier}
              onValueChange={(value) => set('accessTier', value as AccessTier)}
              error={errors.accessTier}
              disabled={pending}
              options={ACCESS_TIERS.map((tier) => ({
                value: tier,
                label: t(`fields.accessTierOptions.${tier}`),
                description: t(`fields.accessTierOptions.${tier}Description`),
              }))}
            />
          </>
        )}
        <FormAlert ref={alertRef} failure={failure} />
      </form>
    </Dialog>
  );
}
