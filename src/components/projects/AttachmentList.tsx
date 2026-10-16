import {
  Download,
  ExternalLink,
  File,
  FileAudio,
  FileText,
  FileVideo,
  Image as ImageIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { LinkButton } from '@/components/ui';
import type { FileKind, FileRef } from '@/types/common';
import { DeleteAttachmentButton } from './DeleteAttachmentButton';
import { attachmentHref, fileSize, fileTypeLabel, INLINE_KINDS } from './projects-model';
import { RefocusHeading } from './RefocusHeading';

const ICONS: Record<FileKind, typeof File> = {
  image: ImageIcon,
  audio: FileAudio,
  video: FileVideo,
  pdf: FileText,
  file: File,
};

export interface AttachmentListProps {
  submissionId: string;
  attachments: FileRef[];
  canDelete: boolean;
  headingLevel: 'h3' | 'h4';
}

/**
 * The files sent with the work, served by /api/files (plain anchors, never the i18n Link).
 * Renders nothing without files. The heading takes focus back after a deletion.
 */
export function AttachmentList({
  submissionId,
  attachments,
  canDelete,
  headingLevel,
}: AttachmentListProps) {
  const t = useTranslations('projects');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  if (attachments.length === 0) return null;
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <RefocusHeading
        as={headingLevel}
        focusKey={attachments.map((file) => file.fileId).join('.')}
        className="text-sm font-semibold text-ink"
      >
        {t('work.attachments', { count: attachments.length })}
      </RefocusHeading>
      <ul className="flex flex-col gap-3">
        {attachments.map((file) => {
          const Icon = ICONS[file.kind];
          const size = fileSize(file.sizeBytes);
          const sizeLabel = tCommon(`units.${size.unit}`, { value: number.format(size.value) });
          const type = fileTypeLabel(file.fileName, file.contentType);
          // The route authorizes on its own (6.9): no submission hint is needed.
          const href = attachmentHref(file.fileId, null);
          const player = t(`attachments.player.${file.kind === 'video' ? 'video' : 'audio'}`, {
            name: file.fileName,
          });
          return (
            <li
              key={file.fileId}
              className="flex min-w-0 flex-col gap-3 rounded-control border border-border bg-surface p-3"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-600"
                >
                  <Icon className="size-5" />
                </span>
                <div className="flex min-w-0 flex-1 basis-40 flex-col">
                  <span className="text-sm font-medium break-all text-ink">{file.fileName}</span>
                  <span className="text-xs text-ink-muted">
                    {type ? t('attachments.meta', { type, size: sizeLabel }) : sizeLabel}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* No aria-label: it would replace the visible word and the new-tab hint. */}
                  {INLINE_KINDS.includes(file.kind) && (
                    <LinkButton
                      href={href}
                      external
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="secondary"
                      size="sm"
                    >
                      <ExternalLink aria-hidden="true" />
                      {t('attachments.open')}
                      <span className="sr-only">
                        {' '}
                        {file.fileName} ({tCommon('a11y.opensInNewTab')})
                      </span>
                    </LinkButton>
                  )}
                  <LinkButton
                    href={attachmentHref(file.fileId, null, { download: true })}
                    external
                    download={file.fileName}
                    variant="secondary"
                    size="sm"
                  >
                    <Download aria-hidden="true" />
                    {t('attachments.download')}
                    <span className="sr-only"> {file.fileName}</span>
                  </LinkButton>
                  {canDelete && <DeleteAttachmentButton submissionId={submissionId} file={file} />}
                </div>
              </div>
              {file.kind === 'audio' && (
                <audio
                  controls
                  preload="none"
                  src={href}
                  aria-label={player}
                  className="w-full max-w-xl"
                />
              )}
              {file.kind === 'video' && (
                <video
                  controls
                  preload="none"
                  src={href}
                  aria-label={player}
                  className="w-full max-w-xl"
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
