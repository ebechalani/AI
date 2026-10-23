'use client';

import { CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MediaImage } from '@/components/domain';
import { FileUpload } from '@/components/projects/FileUpload';
import { Button } from '@/components/ui';
import type { FileRef, MediaRef } from '@/types/common';
import { SECTION_LEGEND } from './challenge-fields';

export interface ChallengeCoverFieldProps {
  /** The cover shown: the stored one, or the one just uploaded. */
  cover: MediaRef | null;
  /** The shown cover was uploaded in this session and is not saved yet. */
  isNew: boolean;
  error?: string;
  disabled: boolean;
  onUploaded: (result: { file: FileRef; media: MediaRef | null }) => void;
  onRemove: () => void;
}

/** The optional cover image: a preview, Remove, and WS-D's upload control. */
export function ChallengeCoverField({
  cover,
  isNew,
  error,
  disabled,
  onUploaded,
  onRemove,
}: ChallengeCoverFieldProps) {
  const t = useTranslations('admin');

  return (
    <fieldset className="flex min-w-0 flex-col gap-4">
      <legend className={SECTION_LEGEND}>{t('challenges.form.coverLegend')}</legend>
      {cover === null ? (
        <p className="text-sm text-ink-muted">{t('challenges.form.coverNone')}</p>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <div className="w-full sm:max-w-sm">
            <MediaImage
              media={cover}
              alt=""
              frame="16:9"
              sizes="(min-width: 640px) 24rem, 100vw"
              className="rounded-card"
            />
          </div>
          {isNew && <p className="text-sm text-ink-muted">{t('challenges.form.coverNew')}</p>}
          <Button variant="ghost" size="sm" disabled={disabled} onClick={onRemove}>
            {t('challenges.form.coverRemove')}
          </Button>
        </div>
      )}
      <FileUpload
        purpose="course_media"
        kinds={['image']}
        courseId={null}
        official
        onUploaded={onUploaded}
      />
      {error !== undefined && (
        <p
          id="challenge-cover-error"
          className="flex items-start gap-1.5 text-sm font-medium text-danger"
          aria-invalid="true"
          tabIndex={-1}
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  );
}
