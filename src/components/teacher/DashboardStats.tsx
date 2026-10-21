import { useTranslations } from 'next-intl';
import { StatCard } from '@/components/domain';

export interface DashboardStatsProps {
  totals: { classes: number; students: number; courses: number };
  /** Projects waiting for review (the queue's count). */
  pending: number;
}

export function DashboardStats({ totals, pending }: DashboardStatsProps) {
  const t = useTranslations('teacher');
  return (
    <section aria-label={t('dashboard.stats.label')} className="mb-8">
      {/* A StatCard's label sits beside a 44 px icon: in a quarter of a 1024 px page, or half
          of a phone, that column is about 60 px, too narrow for "Progression moyenne". */}
      <div className="grid grid-cols-1 gap-4 min-[440px]:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('dashboard.stats.classes')} value={totals.classes} icon="School" />
        <StatCard label={t('dashboard.stats.students')} value={totals.students} icon="Users" />
        <StatCard
          label={t('dashboard.stats.pending')}
          value={pending}
          icon="FolderKanban"
          tone={pending > 0 ? 'warning' : 'default'}
        />
        <StatCard label={t('dashboard.stats.courses')} value={totals.courses} icon="BookOpen" />
      </div>
    </section>
  );
}
