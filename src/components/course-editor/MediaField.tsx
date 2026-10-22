'use client';

import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MediaImage } from '@/components/domain';
import { FileUpload } from '@/components/projects/FileUpload';
import { LinkButton } from '@/components/ui';
import { mediaUrl } from '@/lib/firebase/storage-paths';
import type { FileKind, MediaRef } from '@/types/common';

export interface MediaFieldProps {
  legend: string;
  kinds: FileKind[];
  courseId: string;
  official: boolean;
  media: MediaRef | null;
  preview: 'image' | 'file';
  /** The image's current alt text. */
  alt?: string;
  error?: string;
  onUploaded(fileId: string, media: MediaRef): void;
}

const MB = 1024 * 1024;

/** The current file of a media block and the upload that replaces it (6.3.3). */
export function MediaField({
  legend,
  kinds,
  courseId,
  official,
  media,
  preview,
  alt,
  error,
  onUploaded,
}: MediaFieldProps) {
  const t = useTranslations('courseEditor');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const errorId = useId();
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });

  function size(bytes: number): string {
    return bytes >= MB
      ? tCommon('units.megabytes', { value: number.format(bytes / MB) })
      : tCommon('units.kilobytes', { value: number.format(bytes / 1024) });
  }

  return (
    <fieldset
      className="flex min-w-0 flex-col gap-3"
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="mb-1 text-sm font-semibold text-ink">{legend}</legend>
      {media === null ? (
        <p className="text-sm text-ink-muted">{t('blocks.media.none')}</p>
      ) : preview === 'image' ? (
        <MediaImage media={media} alt={alt ?? ''} sizes="(min-width: 1024px) 480px, 100vw" className="max-h-48 max-w-md rounded-md" />
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span className="min-w-0 font-medium break-all text-ink">{media.fileName}</span>
          <span className="text-ink-muted">{size(media.sizeBytes)}</span>
          <LinkButton
            external
            href={mediaUrl(media)}
            target="_blank"
            rel="noopener"
            size="sm"
            variant="secondary"
          >
            {t('blocks.media.open')}
            <span className="sr-only"> ({tCommon('a11y.opensInNewTab')})</span>
          </LinkButton>
        </div>
      )}
      <FileUpload
        purpose="course_media"
        kinds={kinds}
        courseId={courseId}
        official={official}
        onUploaded={({ file, media: uploaded }) => {
          if (uploaded) onUploaded(file.fileId, uploaded);
        }}
      />
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
