'use client';

import { useTranslations } from 'next-intl';
import { CONTENT_LIMITS } from '@/lib/limits';
import type { Locale } from '@/types/common';
import { linesToList } from './course-model';
import { TextField } from './TextField';

export interface AcceptedAnswersFieldProps {
  questionKey: string;
  language: Locale;
  defaultLocale: Locale;
  /** One accepted answer per line. */
  value: string;
  onChange(value: string): void;
  error?: string;
  disabled: boolean;
}

/** The accepted answers of a short-answer question, one per line (6.4). */
export function AcceptedAnswersField({
  questionKey,
  language,
  defaultLocale,
  value,
  onChange,
  error,
  disabled,
}: AcceptedAnswersFieldProps) {
  const t = useTranslations('courseEditor');
  const max = CONTENT_LIMITS.acceptedAnswersPerQuestion;
  return (
    <TextField
      id={`q-${questionKey}-accepted-${language}`}
      label={t('quiz.acceptedAnswers')}
      locale={language}
      value={value}
      onChange={onChange}
      required={language === defaultLocale}
      multiline
      rows={4}
      max={max * (CONTENT_LIMITS.acceptedAnswerChars + 1)}
      hint={
        <>
          <span className="block">
            {t('quiz.acceptedAnswersHint', { max, chars: CONTENT_LIMITS.acceptedAnswerChars })}
          </span>
          <span className="block">{t('quiz.acceptedCount', { count: linesToList(value).length, max })}</span>
        </>
      }
      error={error}
      disabled={disabled}
    />
  );
}
