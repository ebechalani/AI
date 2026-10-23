'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, Checkbox, IconButton } from '@/components/ui';
import { CONTENT_LIMITS } from '@/lib/limits';
import { cn } from '@/lib/utils';
import type { Locale } from '@/types/common';
import type { QuestionType } from '@/types/quiz';
import { usePendingFocus } from './focus';
import type { OptionDraft } from './quiz-model';
import { TextField } from './TextField';

export interface OptionsFieldProps {
  questionKey: string;
  type: Exclude<QuestionType, 'short_answer'>;
  options: OptionDraft[];
  /** Option keys. */
  correct: string[];
  language: Locale;
  defaultLocale: Locale;
  onChange(options: OptionDraft[], correct: string[]): void;
  /** Relative to the question: 'options', 'correctOptionIndexes', 'options.1.translations.en.text'. */
  errorFor(path: string): string | undefined;
  /** A new option's key (generated in the handler, never while rendering). */
  newKey(): string;
  disabled: boolean;
}

const RADIO =
  'mt-0.5 size-5 shrink-0 cursor-pointer appearance-none rounded-full border border-ink-muted/70 bg-surface transition-[border-color,border-width] hover:border-ink-muted checked:border-[6px] checked:border-brand-600 disabled:cursor-not-allowed disabled:opacity-60';

/** The answers of a choice question and which are correct (6.4). */
export function OptionsField({
  questionKey,
  type,
  options,
  correct,
  language,
  defaultLocale,
  onChange,
  errorFor,
  newKey,
  disabled,
}: OptionsFieldProps) {
  const t = useTranslations('courseEditor');
  const focusLater = usePendingFocus();
  const [announcement, setAnnouncement] = useState('');
  const editable = type !== 'true_false';
  const multiple = type === 'multiple_answer';
  const groupError = errorFor('correctOptionIndexes') ?? errorFor('options');
  const atLimit = options.length >= CONTENT_LIMITS.optionsPerQuestion;

  function mark(key: string, on: boolean) {
    if (multiple) onChange(options, on ? [...correct, key] : correct.filter((k) => k !== key));
    else onChange(options, [key]);
  }

  function setText(key: string, value: string) {
    onChange(
      options.map((option) =>
        option.key === key ? { ...option, text: { ...option.text, [language]: value } } : option,
      ),
      correct,
    );
  }

  const inputIdOf = (key: string) => `q-${questionKey}-o-${key}`;

  function remove(key: string) {
    // The focus goes to the answer before (the next one for the first), never to the page.
    const index = options.findIndex((option) => option.key === key);
    const neighbour = options[index - 1] ?? options[index + 1];
    if (neighbour) focusLater(inputIdOf(neighbour.key));
    setAnnouncement(t('quiz.optionRemoved', { position: index + 1 }));
    onChange(
      options.filter((option) => option.key !== key),
      correct.filter((k) => k !== key),
    );
  }

  function add() {
    const key = newKey();
    const text = Object.fromEntries(
      Object.keys(options[0]?.text ?? { [language]: '' }).map((locale) => [locale, '']),
    ) as Record<Locale, string>;
    onChange([...options, { key, id: null, text, extra: {} }], correct);
  }

  return (
    // Focusable, and the error under the legend, so a failed save shows and reads it (7.3).
    <fieldset
      tabIndex={-1}
      className="flex min-w-0 flex-col gap-3 rounded-control"
      aria-invalid={groupError ? true : undefined}
      aria-describedby={groupError ? `q-${questionKey}-answers-error` : undefined}
    >
      <legend className="mb-1 text-sm font-semibold text-ink">{t('quiz.answers')}</legend>
      <p className="-mt-2 text-sm text-ink-muted">{t(`quiz.answersHint.${type}`)}</p>
      {groupError && (
        <p id={`q-${questionKey}-answers-error`} className="text-sm font-medium text-danger">
          {groupError}
        </p>
      )}
      <ol className="flex flex-col gap-3">
        {options.map((option, index) => {
          const position = index + 1;
          const checked = correct.includes(option.key);
          const inputId = inputIdOf(option.key);
          return (
            <li key={option.key} className="flex items-start gap-3">
              <span className="flex h-11 items-center">
                {multiple ? (
                  <Checkbox
                    aria-label={t('quiz.markCorrect', { position })}
                    checked={checked}
                    disabled={disabled}
                    onChange={(event) => mark(option.key, event.target.checked)}
                  />
                ) : (
                  <input
                    type="radio"
                    name={`correct-${questionKey}`}
                    aria-label={t('quiz.markCorrect', { position })}
                    checked={checked}
                    disabled={disabled}
                    onChange={() => mark(option.key, true)}
                    className={RADIO}
                  />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <TextField
                  id={inputId}
                  label={t('quiz.option', { position })}
                  locale={language}
                  value={option.text[language] ?? ''}
                  onChange={(value) => setText(option.key, value)}
                  required={language === defaultLocale}
                  max={CONTENT_LIMITS.optionTextChars}
                  error={errorFor(`options.${index}.translations.${language}.text`)}
                  disabled={disabled}
                />
              </div>
              {editable && options.length > 2 && (
                <IconButton
                  aria-label={t('quiz.removeOption', { position })}
                  disabled={disabled}
                  onClick={() => remove(option.key)}
                  className={cn('mt-7')}
                >
                  <X />
                </IconButton>
              )}
            </li>
          );
        })}
      </ol>
      {editable && (
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant="secondary" disabled={disabled || atLimit} onClick={add}>
            {t('quiz.addOption')}
          </Button>
          <span className="text-sm text-ink-muted">
            {t('quiz.optionCount', { count: options.length, max: CONTENT_LIMITS.optionsPerQuestion })}
          </span>
        </div>
      )}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </fieldset>
  );
}
