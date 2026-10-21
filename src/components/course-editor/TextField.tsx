'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { FormField, Input, Textarea } from '@/components/ui';
import type { Locale } from '@/types/common';
import { CharCount } from './CharCount';

export interface TextFieldProps {
  label: string;
  /** A translatable field: the label names the language and the control gets `lang`. */
  locale?: Locale;
  /** The control's language without naming it in the label (one-language forms). */
  lang?: Locale;
  value: string;
  onChange(value: string): void;
  required?: boolean;
  max: number;
  multiline?: boolean;
  rows?: number;
  hint?: ReactNode;
  error?: string;
  /** Code: monospace, never trimmed. */
  mono?: boolean;
  disabled?: boolean;
  id?: string;
  type?: 'text' | 'url';
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  autoFocus?: boolean;
}

/**
 * One text field of the editor. No `maxLength`: a paste is never cut silently; the counter shows
 * the limit and the schema reports `too_long`.
 */
export function TextField({
  label,
  locale,
  lang,
  value,
  onChange,
  required,
  max,
  multiline,
  rows,
  hint,
  error,
  mono,
  disabled,
  id,
  type = 'text',
  inputMode,
  autoFocus,
}: TextFieldProps) {
  const t = useTranslations('courseEditor');
  const tCommon = useTranslations('common');
  const fieldLabel =
    locale === undefined
      ? label
      : t('fields.inLanguage', { field: label, language: tCommon(`locale.names.${locale}`) });
  const shared = {
    value,
    lang: locale ?? lang,
    disabled,
    spellCheck: mono ? false : undefined,
    className: mono ? 'font-mono text-sm' : undefined,
    ...(autoFocus && { 'data-autofocus': true }),
  };
  return (
    <FormField
      id={id}
      label={fieldLabel}
      required={required}
      error={error}
      hint={
        <>
          {hint && <span className="block">{hint}</span>}
          <CharCount count={value.length} max={max} />
        </>
      }
    >
      {multiline ? (
        <Textarea rows={rows} {...shared} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <Input
          type={type}
          inputMode={inputMode}
          {...shared}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </FormField>
  );
}
