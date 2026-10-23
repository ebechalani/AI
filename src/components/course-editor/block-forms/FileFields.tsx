'use client';

import { useTranslations } from 'next-intl';
import { CONTENT_LIMITS } from '@/lib/limits';
import { FILE_KINDS } from '@/types/common';
import { MediaField } from '../MediaField';
import { BlockTextField } from './BlockTextField';
import { withData, type BlockDataProps, type BlockTextProps } from './types';

export function FileData({ draft, onChange, errors, context }: BlockDataProps<'file'>) {
  const t = useTranslations('courseEditor');
  return (
    <MediaField
      legend={t('blocks.file.file')}
      kinds={[...FILE_KINDS]}
      courseId={context.courseId}
      official={context.official}
      media={draft.data.media}
      preview="file"
      error={errors('data.fileId')}
      onUploaded={(fileId, media) => onChange(withData(draft, { fileId, media }))}
    />
  );
}

export function FileText(form: BlockTextProps<'file'>) {
  const t = useTranslations('courseEditor');
  return (
    <>
      <BlockTextField form={form} field="label" label={t('blocks.file.label')} max={CONTENT_LIMITS.titleChars} />
      <BlockTextField
        form={form}
        field="description"
        label={t('blocks.file.description')}
        max={CONTENT_LIMITS.fileDescriptionChars}
        multiline
        rows={3}
      />
    </>
  );
}
