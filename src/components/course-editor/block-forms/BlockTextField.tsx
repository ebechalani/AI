'use client';

import type { ReactNode } from 'react';
import type { BlockType } from '@/types/content';
import { REQUIRED_TEXT, type TextFieldOf } from '../block-model';
import { TextField } from '../TextField';
import { withText, type BlockTextProps } from './types';

/** One translatable field of a block, bound to the form's language and draft. */
export function BlockTextField<T extends BlockType>({
  form,
  field,
  label,
  max,
  multiline,
  rows,
  hint,
  mono,
}: {
  form: BlockTextProps<T>;
  field: TextFieldOf<T>;
  label: string;
  max: number;
  multiline?: boolean;
  rows?: number;
  hint?: ReactNode;
  mono?: boolean;
}) {
  const required = form.required && (REQUIRED_TEXT[form.draft.type] as readonly string[]).includes(field);
  return (
    <TextField
      label={label}
      locale={form.locale}
      value={form.draft.text[form.locale][field]}
      onChange={(value) => form.onChange(withText(form.draft, form.locale, field, value))}
      required={required}
      max={max}
      multiline={multiline}
      rows={rows}
      hint={hint}
      mono={mono}
      error={form.errors(`translations.${form.locale}.${String(field)}`)}
      disabled={form.disabled}
    />
  );
}
