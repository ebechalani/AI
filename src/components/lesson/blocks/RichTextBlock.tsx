import { useLocale } from 'next-intl';
import { RichText } from '@/components/domain';
import { pickTranslation } from '@/lib/i18n/content';
import type { BlockRendererProps } from './registry';

/** A heading and Markdown text (ARCHITECTURE.md 7.6). Markdown headings start at h3. */
export function RichTextBlock({ block }: BlockRendererProps<'rich_text'>) {
  const text = pickTranslation(block.translations, useLocale(), block.defaultLocale);
  return (
    <div className="flex flex-col gap-3">
      {text.heading && (
        <h3 className="text-lg leading-snug font-semibold text-ink">{text.heading}</h3>
      )}
      <RichText markdown={text.body} />
    </div>
  );
}
