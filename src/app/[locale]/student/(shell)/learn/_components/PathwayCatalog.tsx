import { Route } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PathwayCard } from '@/components/domain';
import { EmptyState } from '@/components/ui';
import type { Pathway } from '@/types/content';
import { pathwayCardProgress } from './learn-model';

export interface PathwayCatalogProps {
  /** Student pathways, in display order. */
  pathways: Pathway[];
  /** Completed courses per pathway with at least one enrolment (`pathwayProgress`). */
  progress: ReadonlyMap<string, number>;
}

/**
 * Every student pathway. The section is the target of the "Browse pathways" link, so it takes
 * focus (tabIndex -1); the shell keeps it clear of the sticky top bar when it is scrolled to
 * (ARCHITECTURE.md 7.5), so it has no `scroll-mt-*` of its own.
 */
export function PathwayCatalog({ pathways, progress }: PathwayCatalogProps) {
  const t = useTranslations('learn');
  return (
    <section
      id="pathways"
      aria-labelledby="learn-pathways"
      tabIndex={-1}
      className="flex min-w-0 flex-col gap-4 outline-none"
    >
      <div className="flex flex-col gap-1">
        <h2 id="learn-pathways" className="text-xl font-bold text-ink">
          {t('catalog.title')}
        </h2>
        <p className="max-w-2xl text-sm text-ink-muted">{t('catalog.description')}</p>
      </div>
      {pathways.length === 0 ? (
        <EmptyState
          icon={<Route />}
          title={t('catalog.empty.title')}
          description={t('catalog.empty.description')}
        />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {pathways.map((pathway) => (
            <li key={pathway.id} className="min-w-0">
              <PathwayCard
                pathway={pathway}
                href={`/student/learn/pathways/${pathway.id}`}
                progress={pathwayCardProgress(pathway, progress)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
