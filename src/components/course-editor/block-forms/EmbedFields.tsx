'use client';

import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { RadioGroup } from '@/components/ui';
import { EMBED_HOSTS } from '@/lib/learning/embed-allowlist';
import { CONTENT_LIMITS } from '@/lib/limits';
import { EMBED_ASPECT_RATIOS, type EmbedAspectRatio } from '@/types/content';
import { TextField } from '../TextField';
import { BlockTextField } from './BlockTextField';
import { withData, type BlockDataProps, type BlockTextProps } from './types';

const RATIO_KEYS: Record<EmbedAspectRatio, 'wide' | 'standard' | 'square'> = {
  '16:9': 'wide',
  '4:3': 'standard',
  '1:1': 'square',
};

export function EmbedData({ draft, onChange, errors, disabled }: BlockDataProps<'embed'>) {
  const t = useTranslations('courseEditor');
  const locale = useLocale();
  const name = useId();
  const hosts = new Intl.ListFormat(locale, { type: 'conjunction' }).format(EMBED_HOSTS);
  return (
    <>
      <TextField
        label={t('blocks.embed.url')}
        value={draft.data.url}
        onChange={(url) => onChange(withData(draft, { url }))}
        required
        type="url"
        inputMode="url"
        max={CONTENT_LIMITS.embedUrlChars}
        hint={t('blocks.embed.urlHint', { hosts })}
        error={errors('data.url')}
        disabled={disabled}
      />
      <RadioGroup
        legend={t('blocks.embed.ratio')}
        name={name}
        orientation="horizontal"
        value={draft.data.aspectRatio}
        disabled={disabled}
        error={errors('data.aspectRatio')}
        onValueChange={(value) => onChange(withData(draft, { aspectRatio: value as EmbedAspectRatio }))}
        options={EMBED_ASPECT_RATIOS.map((ratio) => ({
          value: ratio,
          label: t(`blocks.embed.ratios.${RATIO_KEYS[ratio]}`),
        }))}
      />
    </>
  );
}

export function EmbedText(form: BlockTextProps<'embed'>) {
  const t = useTranslations('courseEditor');
  return (
    <>
      <BlockTextField form={form} field="title" label={t('blocks.embed.title')} max={CONTENT_LIMITS.titleChars} />
      <BlockTextField form={form} field="caption" label={t('blocks.embed.caption')} max={CONTENT_LIMITS.captionChars} />
    </>
  );
}
