import { useLocale } from 'next-intl';
import { pickTranslation } from '@/lib/i18n/content';
import { toEmbedUrl } from '@/lib/learning/embed-allowlist';
import { cn } from '@/lib/utils';
import type { EmbedAspectRatio } from '@/types/content';
import { FRAME_ATTRIBUTES } from './frame';
import type { BlockRendererProps } from './registry';

const FRAMES: Record<EmbedAspectRatio, string> = {
  '16:9': 'aspect-video',
  '4:3': 'aspect-4/3',
  '1:1': 'aspect-square',
};

/**
 * A sandboxed iframe of an allowed host. A stored URL is still only data, so it is checked
 * again here; one that may not be framed renders nothing (ARCHITECTURE.md 7.6).
 */
export function EmbedBlock({ block }: BlockRendererProps<'embed'>) {
  const locale = useLocale();
  const src = toEmbedUrl(block.data.url);
  if (src === null) return null;
  const text = pickTranslation(block.translations, locale, block.defaultLocale);

  return (
    <figure className="flex flex-col gap-3">
      <h3 className="text-lg leading-snug font-semibold text-ink">{text.title}</h3>
      <div
        className={cn(
          'relative overflow-hidden rounded-card border border-border bg-surface-muted',
          FRAMES[block.data.aspectRatio] ?? FRAMES['16:9'],
        )}
      >
        <iframe
          src={src}
          title={text.title}
          className="absolute inset-0 size-full"
          {...FRAME_ATTRIBUTES}
        />
      </div>
      {text.caption && <figcaption className="text-sm text-ink-muted">{text.caption}</figcaption>}
    </figure>
  );
}
