'use client';

import { useTranslations } from 'next-intl';
import { pickTranslation } from '@/lib/i18n/content';
import { CONTENT_LIMITS } from '@/lib/limits';
import { MediaField } from '../MediaField';
import { BlockTextField } from './BlockTextField';
import { withData, type BlockDataProps, type BlockTextProps } from './types';

export function ImageData({ draft, onChange, errors, context }: BlockDataProps<'image'>) {
  const t = useTranslations('courseEditor');
  const alt = pickTranslation(draft.text, draft.defaultLocale, draft.defaultLocale).alt;
  return (
    <MediaField
      legend={t('blocks.image.file')}
      kinds={['image']}
      courseId={context.courseId}
      official={context.official}
      media={draft.data.media}
      preview="image"
      alt={alt}
      error={errors('data.fileId')}
      onUploaded={(fileId, media) => onChange(withData(draft, { fileId, media }))}
    />
  );
}

export function ImageText(form: BlockTextProps<'image'>) {
  const t = useTranslations('courseEditor');
  return (
    <>
      <BlockTextField
        form={form}
        field="alt"
        label={t('blocks.image.alt')}
        max={CONTENT_LIMITS.captionChars}
        hint={t('blocks.image.altHint')}
      />
      <BlockTextField form={form} field="caption" label={t('blocks.image.caption')} max={CONTENT_LIMITS.captionChars} />
    </>
  );
}
