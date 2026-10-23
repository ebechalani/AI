import { useTranslations } from 'next-intl';
import { StatCard } from '@/components/domain';
import type { SchoolStats } from '@/types/analytics';
import { completionRate } from './school-model';

/**
 * One column below 440 px, two from there, four from `xl`: a `StatCard`'s label beside its icon
 * would overflow a quarter-width column below `xl` (WS-E-6).
 */
export const STAT_GRID = 'grid grid-cols-1 gap-4 min-[440px]:grid-cols-2 xl:grid-cols-4';

/** The school in four numbers: teachers, students, classes and the completion rate. */
export function DashboardStats({ stats }: { stats: SchoolStats }) {
  const t = useTranslations('school');
  const tCommon = useTranslations('common');
  const rate = completionRate(stats);

  return (
    <section aria-label={t('dashboard.stats.label')} className={STAT_GRID}>
      <StatCard
        label={t('dashboard.stats.teachers')}
        value={stats.teachers}
        icon="GraduationCap"
        hint={t('dashboard.stats.teachersHint')}
      />
      <StatCard
        label={t('dashboard.stats.students')}
        value={stats.students}
        icon="Users"
        hint={t('dashboard.stats.studentsHint')}
      />
      <StatCard label={t('dashboard.stats.classes')} value={stats.classes} icon="School" />
      <StatCard
        label={t('dashboard.stats.completion')}
        tone="brand"
        icon="TrendingUp"
        value={
          rate === null ? t('dashboard.stats.noValue') : tCommon('units.percent', { value: rate })
        }
        hint={
          rate === null
            ? t('dashboard.stats.completionNone')
            : t('dashboard.stats.completionHint', {
                completed: stats.completedEnrollments,
                enrollments: stats.enrollments,
              })
        }
      />
    </section>
  );
}
