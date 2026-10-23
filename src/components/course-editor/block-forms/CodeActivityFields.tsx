'use client';

import { useTranslations } from 'next-intl';
import { FormField, Select } from '@/components/ui';
import { CONTENT_LIMITS } from '@/lib/limits';
import { CODE_LANGUAGES, type CodeLanguage } from '@/types/content';
import { TextField } from '../TextField';
import { BlockTextField } from './BlockTextField';
import { withData, type BlockDataProps, type BlockTextProps } from './types';

export function CodeActivityData({ draft, onChange, errors, disabled }: BlockDataProps<'code_activity'>) {
  const t = useTranslations('courseEditor');
  return (
    <>
      <FormField label={t('blocks.code.language')} error={errors('data.language')} className="max-w-xs">
        <Select
          value={draft.data.language}
          disabled={disabled}
          onChange={(event) =>
            onChange(withData(draft, { language: event.target.value as CodeLanguage }))
          }
          options={CODE_LANGUAGES.map((language) => ({
            value: language,
            label: t(`blocks.code.languages.${language}`),
          }))}
        />
      </FormField>
      <TextField
        label={t('blocks.code.starter')}
        value={draft.data.starterCode}
        onChange={(starterCode) => onChange(withData(draft, { starterCode }))}
        multiline
        rows={8}
        mono
        max={CONTENT_LIMITS.starterCodeChars}
        error={errors('data.starterCode')}
        disabled={disabled}
      />
    </>
  );
}

export function CodeActivityText(form: BlockTextProps<'code_activity'>) {
  const t = useTranslations('courseEditor');
  return (
    <>
      <BlockTextField
        form={form}
        field="instructions"
        label={t('blocks.code.instructions')}
        max={CONTENT_LIMITS.activityInstructionsChars}
        multiline
        rows={5}
      />
      <BlockTextField form={form} field="hint" label={t('blocks.code.hint')} max={CONTENT_LIMITS.hintChars} multiline rows={3} />
    </>
  );
}
