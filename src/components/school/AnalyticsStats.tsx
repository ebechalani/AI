import { useTranslations } from 'next-intl';
import { StatCard } from '@/components/domain';
import type { SchoolStats } from '@/types/analytics';
import { STAT_GRID } from './DashboardStats';
import { completionRate } from './school-model';

/** The school's course enrollments: completion rate, enrollments, completed, certificates. */
export function AnalyticsStats({ stats }: { stats: SchoolStats }) {
  const t = useTranslations('school');
  const tCommon = useTranslations('common');
  const rate = completionRate(stats);

  return (
    <section aria-label={t('analytics.stats.label')} className={STAT_GRID}>
      <StatCard
        label={t('analytics.stats.rate')}
        tone="brand"
        icon="TrendingUp"
        value={
          rate === null ? t('dashboard.stats.noValue') : tCommon('units.percent', { value: rate })
        }
        hint={
          rate === null
            ? t('analytics.stats.rateNone')
            : t('analytics.stats.rateHint', {
                completed: stats.completedEnrollments,
                enrollments: stats.enrollments,
              })
        }
      />
      <StatCard
        label={t('analytics.stats.enrollments')}
        value={stats.enrollments}
        icon="BookOpen"
        hint={t('analytics.stats.inProgress', {
          count: Math.max(0, stats.enrollments - stats.completedEnrollments),
        })}
      />
      <StatCard
        label={t('analytics.stats.completed')}
        value={stats.completedEnrollments}
        icon="BadgeCheck"
        tone="success"
      />
      <StatCard
        label={t('analytics.stats.certificates')}
        value={stats.certificates}
        icon="Award"
      />
    </section>
  );
}
