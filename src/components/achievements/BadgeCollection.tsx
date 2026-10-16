import { Medal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BadgeTile } from '@/components/domain';
import { PageSection } from '@/components/robotics/PageSection';
import { Alert, EmptyState } from '@/components/ui';
import type { Badge } from '@/types/gamification';
import type { EarnedBadge } from './achievements-model';

const GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4';

export interface BadgeCollectionProps {
  /** Earned badges (newest first) and the active ones still to earn; null when a read failed. */
  collection: { earned: readonly EarnedBadge[]; locked: readonly Badge[] } | null;
}

export function BadgeCollection({ collection }: BadgeCollectionProps) {
  const t = useTranslations('achievements');
  const earned = collection?.earned.length ?? 0;
  const total = earned + (collection?.locked.length ?? 0);

  return (
    <PageSection
      id="achievements-badges"
      title={t('badges.title')}
      description={collection && total > 0 ? t('badges.summary', { earned, total }) : undefined}
    >
      {collection === null ? (
        <Alert tone="warning" live="off">
          {t('sectionError')}
        </Alert>
      ) : total === 0 ? (
        <EmptyState
          icon={<Medal />}
          title={t('badges.empty.title')}
          description={t('badges.empty.description')}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h3 className="text-base font-semibold text-ink">{t('badges.earned')}</h3>
            {collection.earned.length > 0 ? (
              <ul className={GRID}>
                {collection.earned.map(({ badge, awardedAt }) => (
                  <li key={badge.id} className="min-w-0">
                    <BadgeTile badge={badge} earnedAt={awardedAt} className="h-full" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">{t('badges.noneEarned')}</p>
            )}
          </div>
          {collection.locked.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-base font-semibold text-ink">{t('badges.locked')}</h3>
              <ul className={GRID}>
                {collection.locked.map((badge) => (
                  <li key={badge.id} className="min-w-0">
                    <BadgeTile badge={badge} className="h-full" />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </PageSection>
  );
}
