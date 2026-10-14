import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert, LinkButton } from '@/components/ui';
import type { Pathway } from '@/types/content';
import { PathwayGrid } from './PathwayGrid';
import { Section } from './Section';

export interface PathwaysSectionProps {
  /** The published student pathways; `null` when they could not be read. */
  pathways: readonly Pathway[] | null;
}

/** "Learning Pathways": the cards come from the database, never from this file. */
export function PathwaysSection({ pathways }: PathwaysSectionProps) {
  const t = useTranslations('home');
  return (
    <Section
      id="pathways"
      eyebrow={t('pathways.eyebrow')}
      title={t('pathways.title')}
      description={t('pathways.description')}
    >
      {pathways === null ? (
        <Alert
          tone="warning"
          live="off"
          action={
            <LinkButton href="/pathways" variant="secondary" size="sm">
              {t('pathways.viewAll')}
            </LinkButton>
          }
        >
          {t('pathways.unavailable')}
        </Alert>
      ) : (
        <PathwayGrid
          pathways={pathways}
          emptyTitle={t('pathways.empty.title')}
          emptyDescription={t('pathways.empty.description')}
        />
      )}
      {pathways !== null && pathways.length > 0 && (
        <div className="mt-8 flex justify-center">
          <LinkButton href="/pathways" variant="secondary" size="lg">
            {t('pathways.viewAll')}
            <ArrowRight aria-hidden="true" className="rtl:-scale-x-100" />
          </LinkButton>
        </div>
      )}
    </Section>
  );
}
