import { useTranslations } from 'next-intl';
import { StatCard } from '@/components/domain';
import type { ReportSummaryValues } from './reports-model';

export interface ReportSummaryProps {
  values: ReportSummaryValues;
}

export function ReportSummary({ values }: ReportSummaryProps) {
  const t = useTranslations('reports');
  const tCommon = useTranslations('common');
  return (
    <section aria-label={t('summary.label')} className="mb-6">
      {/* A StatCard's label sits beside a 44 px icon: in a quarter of a 1024 px page, or half
          of a phone, that column is about 60 px, too narrow for "Progression moyenne". */}
      <div className="grid grid-cols-1 gap-4 min-[440px]:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('summary.students')} value={values.students} icon="Users" />
        <StatCard
          label={t('summary.averageProgress')}
          value={tCommon('units.percent', { value: values.averageProgress })}
          icon="TrendingUp"
        />
        <StatCard label={t('summary.completed')} value={values.completed} icon="Trophy" />
        <StatCard label={t('summary.certificates')} value={values.certificates} icon="Award" />
      </div>
    </section>
  );
}
