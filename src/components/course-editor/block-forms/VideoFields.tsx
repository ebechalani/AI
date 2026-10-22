'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { FormField, Input, RadioGroup } from '@/components/ui';
import { CONTENT_LIMITS } from '@/lib/limits';
import { VIDEO_SOURCES, type VideoSource } from '@/types/content';
import { MediaField } from '../MediaField';
import { TextField } from '../TextField';
import { extractVideoId } from '../video-model';
import { BlockTextField } from './BlockTextField';
import { withData, type BlockDataProps, type BlockTextProps } from './types';

export function VideoData({ draft, onChange, errors, context, disabled }: BlockDataProps<'video'>) {
  const t = useTranslations('courseEditor');
  const name = useId();
  const { source, videoId, media, duration } = draft.data;
  const found = source === 'file' ? null : extractVideoId(source, videoId);
  return (
    <>
      <RadioGroup
        legend={t('blocks.video.source')}
        name={name}
        orientation="horizontal"
        value={source}
        disabled={disabled}
        error={errors('data.source')}
        onValueChange={(value) => onChange(withData(draft, { source: value as VideoSource }))}
        options={VIDEO_SOURCES.map((candidate) => ({
          value: candidate,
          label: t(`blocks.video.sources.${candidate}`),
        }))}
      />
      {source === 'file' ? (
        <MediaField
          legend={t('blocks.video.file')}
          kinds={['video']}
          courseId={context.courseId}
          official={context.official}
          media={media}
          preview="file"
          error={errors('data.fileId')}
          onUploaded={(fileId, uploaded) => onChange(withData(draft, { fileId, media: uploaded }))}
        />
      ) : (
        <TextField
          label={source === 'youtube' ? t('blocks.video.idYoutube') : t('blocks.video.idVimeo')}
          value={videoId}
          onChange={(value) => onChange(withData(draft, { videoId: value }))}
          required
          type="url"
          max={CONTENT_LIMITS.embedUrlChars}
          hint={found === null ? t('blocks.video.idHint') : t('blocks.video.idFound', { id: found })}
          error={errors('data.videoId')}
          disabled={disabled}
        />
      )}
      <FormField
        label={t('blocks.video.duration')}
        hint={t('blocks.video.durationHint')}
        error={errors('data.durationSeconds')}
        className="max-w-40"
      >
        <Input
          inputMode="numeric"
          placeholder="m:ss"
          value={duration}
          disabled={disabled}
          onChange={(event) => onChange(withData(draft, { duration: event.target.value }))}
        />
      </FormField>
    </>
  );
}

export function VideoText(form: BlockTextProps<'video'>) {
  const t = useTranslations('courseEditor');
  return (
    <>
      <BlockTextField form={form} field="title" label={t('blocks.video.title')} max={CONTENT_LIMITS.titleChars} />
      <BlockTextField form={form} field="caption" label={t('blocks.video.caption')} max={CONTENT_LIMITS.captionChars} />
      <BlockTextField
        form={form}
        field="transcript"
        label={t('blocks.video.transcript')}
        max={CONTENT_LIMITS.videoTranscriptChars}
        multiline
        rows={6}
        hint={t('blocks.video.transcriptHint')}
      />
    </>
  );
}
