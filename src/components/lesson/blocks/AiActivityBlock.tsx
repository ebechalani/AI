import { Bot } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { AiActivityLauncher } from '@/components/ai/AiActivityLauncher';
import { Card, Chip } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import type { BlockRendererProps } from './registry';

/**
 * An activity done with the tutor (ARCHITECTURE.md 7.6): the instructions, the suggested
 * question, and a button that opens the tutor with it. Nothing when the tutor is off.
 */
export function AiActivityBlock({ block, runtime }: BlockRendererProps<'ai_activity'>) {
  const t = useTranslations('tutor');
  const tDomain = useTranslations('domain');
  const text = pickTranslation(block.translations, useLocale(), block.defaultLocale);
  if (!runtime.tutorEnabled) return null;

  return (
    <Card>
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg leading-snug font-semibold text-ink">{t('activity.title')}</h3>
          <Chip tone="brand" icon={<Bot aria-hidden="true" />}>
            {tDomain(`tutorModes.${block.data.tutorMode}`)}
          </Chip>
        </div>
        <p className="leading-relaxed whitespace-pre-line text-ink">{text.instructions}</p>
        {text.starterPrompt && (
          <figure className="rounded-control border-s-4 border-brand-300 bg-brand-50 px-4 py-3">
            <figcaption className="text-xs font-semibold text-ink-muted">
              {t('activity.starterLabel')}
            </figcaption>
            <blockquote className="mt-1 break-words text-ink">{text.starterPrompt}</blockquote>
          </figure>
        )}
        <AiActivityLauncher
          mode={block.data.tutorMode}
          starterPrompt={text.starterPrompt}
          labToolId={block.data.labToolId}
        />
      </div>
    </Card>
  );
}
