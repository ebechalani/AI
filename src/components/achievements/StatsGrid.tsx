import { useTranslations } from 'next-intl';
import { StatCard } from '@/components/domain';
import { PageSection } from '@/components/robotics/PageSection';
import type { UserStats } from '@/types/user';
import { STAT_ITEMS } from './achievements-model';

export interface StatsGridProps {
  stats: UserStats;
}

/** The progress counters of the profile. Badges are counted by the badge section. */
export function StatsGrid({ stats }: StatsGridProps) {
  const t = useTranslations('achievements');
  return (
    <PageSection id="achievements-stats" title={t('stats.title')}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STAT_ITEMS.map(({ key, icon }) => (
          <li key={key} className="min-w-0">
            <StatCard
              label={t(`stats.${key}`)}
              value={stats[key] ?? 0}
              icon={icon}
              tone={key === 'certificates' ? 'brand' : 'default'}
              className="h-full"
            />
          </li>
        ))}
      </ul>
    </PageSection>
  );
}
