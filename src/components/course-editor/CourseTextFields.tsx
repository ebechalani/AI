'use client';

import { useTranslations } from 'next-intl';
import { CONTENT_LIMITS } from '@/lib/limits';
import type { Locale } from '@/types/common';
import type { CourseTextField } from './course-model';
import { TextField } from './TextField';

export interface CourseTextFieldsProps {
  language: Locale;
  /** The shown language is the course's default one: title, summary and description are required. */
  required: boolean;
  text: Record<CourseTextField, string>;
  onChange(field: CourseTextField, value: string): void;
  errorFor(path: string): string | undefined;
  errorUnder(prefix: string): string | undefined;
  disabled: boolean;
}

/** Title, summary, description and outcomes in one language (6.2.4). */
export function CourseTextFields({
  language,
  required,
  text,
  onChange,
  errorFor,
  errorUnder,
  disabled,
}: CourseTextFieldsProps) {
  const t = useTranslations('courseEditor');
  const path = (field: CourseTextField) => `translations.${language}.${field}`;
  return (
    <>
      <TextField
        label={t('fields.title')}
        locale={language}
        value={text.title}
        onChange={(value) => onChange('title', value)}
        required={required}
        max={CONTENT_LIMITS.titleChars}
        error={errorFor(path('title'))}
        disabled={disabled}
      />
      <TextField
        label={t('fields.summary')}
        locale={language}
        value={text.summary}
        onChange={(value) => onChange('summary', value)}
        required={required}
        multiline
        rows={2}
        max={CONTENT_LIMITS.summaryChars}
        hint={t('fields.summaryHint')}
        error={errorFor(path('summary'))}
        disabled={disabled}
      />
      <TextField
        label={t('fields.description')}
        locale={language}
        value={text.description}
        onChange={(value) => onChange('description', value)}
        required={required}
        multiline
        rows={6}
        max={CONTENT_LIMITS.descriptionChars}
        error={errorFor(path('description'))}
        disabled={disabled}
      />
      <TextField
        label={t('fields.outcomes')}
        locale={language}
        value={text.outcomes}
        onChange={(value) => onChange('outcomes', value)}
        multiline
        rows={4}
        max={CONTENT_LIMITS.outcomesPerCourse * (CONTENT_LIMITS.outcomeChars + 1)}
        hint={t('fields.outcomesHint', {
          max: CONTENT_LIMITS.outcomesPerCourse,
          chars: CONTENT_LIMITS.outcomeChars,
        })}
        error={errorUnder(path('outcomes'))}
        disabled={disabled}
      />
    </>
  );
}
