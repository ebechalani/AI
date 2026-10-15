import { useLocale } from 'next-intl';
import { MediaImage } from '@/components/domain';
import { pickTranslation } from '@/lib/i18n/content';
import type { BlockRendererProps } from './registry';

/** An uploaded image with its alt text and an optional caption. */
export function ImageBlock({ block }: BlockRendererProps<'image'>) {
  const text = pickTranslation(block.translations, useLocale(), block.defaultLocale);
  return (
    <figure className="flex flex-col gap-2">
      <MediaImage
        media={block.data.media}
        alt={text.alt}
        sizes="(min-width: 48rem) 48rem, 100vw"
        className="rounded-card"
      />
      {text.caption && <figcaption className="text-sm text-ink-muted">{text.caption}</figcaption>}
    </figure>
  );
}
