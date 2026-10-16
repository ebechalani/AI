'use client';

import { useTranslations } from 'next-intl';
import { FormField, Input, Select, Textarea } from '@/components/ui';
import { SUBMISSION_LIMITS } from '@/lib/limits';
import { CODE_LANGUAGES } from '@/types/content';
import type { SubmissionType } from '@/types/common';
import type { FormField as DraftField } from './submission-form-model';

type ContentField = Extract<DraftField, 'text' | 'code' | 'codeLanguage' | 'linkUrl'>;

export interface SubmissionContentFieldsProps {
  type: SubmissionType;
  values: Record<ContentField, string>;
  onChange: (field: ContentField, value: string) => void;
  /** Translated messages by field. */
  errors: Partial<Record<DraftField, string>>;
  ids: Record<ContentField, string>;
}

/** The work itself for text, code and link; the file types use AttachmentsField instead. */
export function SubmissionContentFields({
  type,
  values,
  onChange,
  errors,
  ids,
}: SubmissionContentFieldsProps) {
  const t = useTranslations('projects');

  if (type === 'text') {
    return (
      <FormField
        id={ids.text}
        label={t('form.text.label')}
        hint={t('form.text.hint', { max: SUBMISSION_LIMITS.textChars })}
        error={errors.text}
        required
      >
        <Textarea
          name="text"
          rows={10}
          maxLength={SUBMISSION_LIMITS.textChars}
          value={values.text}
          onChange={(event) => onChange('text', event.target.value)}
        />
      </FormField>
    );
  }

  if (type === 'code') {
    return (
      <div className="flex flex-col gap-5">
        <FormField
          id={ids.codeLanguage}
          label={t('form.codeLanguage.label')}
          error={errors.codeLanguage}
          optional
          className="max-w-xs"
        >
          <Select
            name="codeLanguage"
            placeholder={t('form.codeLanguage.placeholder')}
            value={values.codeLanguage}
            onChange={(event) => onChange('codeLanguage', event.target.value)}
            options={CODE_LANGUAGES.map((language) => ({
              value: language,
              label: t(`codeLanguages.${language}`),
            }))}
          />
        </FormField>
        <FormField
          id={ids.code}
          label={t('form.code.label')}
          hint={t('form.code.hint', { max: SUBMISSION_LIMITS.codeChars })}
          error={errors.code}
          required
        >
          {/* Tab is not captured: keyboard users must be able to leave the field. */}
          <Textarea
            name="code"
            rows={14}
            maxLength={SUBMISSION_LIMITS.codeChars}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            wrap="off"
            className="font-mono text-sm"
            value={values.code}
            onChange={(event) => onChange('code', event.target.value)}
          />
        </FormField>
      </div>
    );
  }

  if (type === 'link') {
    return (
      <FormField
        id={ids.linkUrl}
        label={t('form.link.label')}
        hint={t('form.link.hint')}
        error={errors.linkUrl}
        required
      >
        <Input
          name="linkUrl"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="https://"
          maxLength={SUBMISSION_LIMITS.linkUrlChars}
          value={values.linkUrl}
          onChange={(event) => onChange('linkUrl', event.target.value)}
        />
      </FormField>
    );
  }

  return null;
}
