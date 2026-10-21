import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, ProgressBar } from '@/components/ui';
import type { CourseUsageRow } from '@/types/analytics';

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{label}</dt>
      <dd className="font-medium text-ink">{children}</dd>
    </div>
  );
}

/** How the school's classes use one course: enrolled, completed, completion rate. */
export function CourseUsageCard({ usage }: { usage: CourseUsageRow | undefined }) {
  const t = useTranslations('school');
  const locale = useLocale();
  const number = new Intl.NumberFormat(locale);

  return (
    <Card as="section" aria-labelledby="usage-title" className="gap-4 p-5 sm:p-6">
      <h2 id="usage-title" className="text-lg leading-snug font-bold text-ink">
        {t('course.usage.title')}
      </h2>
      {usage === undefined ? (
        <p className="text-sm text-ink-muted">{t('course.usage.none')}</p>
      ) : (
        <dl className="flex flex-col gap-3 text-sm">
          <Fact label={t('course.usage.enrolled')}>{number.format(usage.enrollments)}</Fact>
          <Fact label={t('course.usage.completed')}>{number.format(usage.completed)}</Fact>
          <Fact label={t('course.usage.rate')}>
            <ProgressBar
              value={usage.completionRatePercent}
              showValue
              label={t('course.usage.rate')}
            />
          </Fact>
        </dl>
      )}
    </Card>
  );
}
