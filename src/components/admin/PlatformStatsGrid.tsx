import { useTranslations } from 'next-intl';
import { StatCard } from '@/components/domain';
import type { PlatformStats } from '@/types/analytics';

export interface PlatformStatsGridProps {
  stats: PlatformStats;
}

/** The ten platform numbers of the dashboard (ARCHITECTURE.md 6.7). */
export function PlatformStatsGrid({ stats }: PlatformStatsGridProps) {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const completed = stats.completedEnrollments;
  const total = stats.enrollments;
  const completion =
    total > 0
      ? {
          value: tCommon('units.percent', { value: Math.round((completed / total) * 100) }),
          hint: t('dashboard.stats.completionHint', { completed, total }),
        }
      : { value: t('shared.noValue'), hint: t('dashboard.stats.completionNone') };

  return (
    <section aria-label={t('dashboard.stats.label')}>
      <div className="grid grid-cols-1 gap-4 min-[440px]:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('dashboard.stats.schools')} value={stats.schools} icon="Building2" />
        <StatCard label={t('dashboard.stats.students')} value={stats.users.student} icon="Users" />
        <StatCard
          label={t('dashboard.stats.teachers')}
          value={stats.users.teacher}
          icon="GraduationCap"
        />
        <StatCard
          label={t('dashboard.stats.schoolAdmins')}
          value={stats.users.school_admin}
          icon="ShieldCheck"
        />
        <StatCard
          label={t('dashboard.stats.platformAdmins')}
          value={stats.users.platform_admin}
          icon="Crown"
        />
        <StatCard
          label={t('dashboard.stats.officialCourses')}
          value={stats.officialCourses}
          icon="BookOpen"
        />
        <StatCard label={t('dashboard.stats.enrollments')} value={total} icon="ChartLine" />
        <StatCard
          label={t('dashboard.stats.completion')}
          value={completion.value}
          hint={completion.hint}
          icon="TrendingUp"
          tone="brand"
        />
        <StatCard
          label={t('dashboard.stats.submissions')}
          value={stats.submissions}
          icon="FolderKanban"
        />
        <StatCard label={t('dashboard.stats.certificates')} value={stats.certificates} icon="Award" />
      </div>
    </section>
  );
}
