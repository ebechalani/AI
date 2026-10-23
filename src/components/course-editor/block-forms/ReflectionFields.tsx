'use client';

import { useTranslations } from 'next-intl';
import { CONTENT_LIMITS } from '@/lib/limits';
import { NumberField } from '../NumberField';
import { BlockTextField } from './BlockTextField';
import { withData, type BlockDataProps, type BlockTextProps } from './types';

export function ReflectionData({ draft, onChange, errors, disabled }: BlockDataProps<'reflection'>) {
  const t = useTranslations('courseEditor');
  return (
    <NumberField
      label={t('blocks.reflection.minLength')}
      value={draft.data.minLength}
      onChange={(minLength) => onChange(withData(draft, { minLength }))}
      min={0}
      max={CONTENT_LIMITS.reflectionMinLengthMax}
      required
      hint={t('blocks.reflection.minLengthHint', { max: CONTENT_LIMITS.reflectionMinLengthMax })}
      error={errors('data.minLength')}
      disabled={disabled}
    />
  );
}

export function ReflectionText(form: BlockTextProps<'reflection'>) {
  const t = useTranslations('courseEditor');
  return (
    <BlockTextField
      form={form}
      field="prompt"
      label={t('blocks.reflection.prompt')}
      max={CONTENT_LIMITS.reflectionPromptChars}
      multiline
      rows={3}
    />
  );
}
