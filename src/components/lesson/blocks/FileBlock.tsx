import { Download, FileText } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, LinkButton } from '@/components/ui';
import { mediaUrl } from '@/lib/firebase/storage-paths';
import { pickTranslation } from '@/lib/i18n/content';
import { fileSize, fileTypeLabel } from './file-meta';
import type { BlockRendererProps } from './registry';

/** A downloadable file: its label, description, type and size, and the download link. */
export function FileBlock({ block }: BlockRendererProps<'file'>) {
  const locale = useLocale();
  const t = useTranslations('lesson');
  const tCommon = useTranslations('common');
  const text = pickTranslation(block.translations, locale, block.defaultLocale);
  const { media } = block.data;
  const size = fileSize(media.sizeBytes);
  const sizeLabel = tCommon(`units.${size.unit}`, {
    value: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(size.value),
  });
  const type = fileTypeLabel(media.fileName, media.contentType);

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-4 p-5">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-600"
        >
          <FileText className="size-6" />
        </span>
        <div className="flex min-w-0 flex-1 basis-48 flex-col gap-1">
          <h3 className="leading-snug font-semibold break-words text-ink">{text.label}</h3>
          {text.description && <p className="text-sm text-ink-muted">{text.description}</p>}
          <p className="text-xs font-medium text-ink-muted">
            {type ? t('blocks.file.meta', { type, size: sizeLabel }) : sizeLabel}
          </p>
        </div>
        {/* Always external: /api/files/… must not get a locale prefix, and an absolute Storage
          URL opens in a new tab with the hint. */}
        <LinkButton
          href={mediaUrl(media)}
          external
          download={media.fileName}
          variant="secondary"
          aria-label={t('blocks.file.downloadName', { name: text.label })}
        >
          <Download aria-hidden="true" />
          {t('blocks.file.download')}
        </LinkButton>
      </div>
    </Card>
  );
}
