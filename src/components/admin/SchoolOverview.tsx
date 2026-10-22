import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { StatCard, useDateFormat } from '@/components/domain';
import { Alert, Card, CardBody } from '@/components/ui';
import { AI_LIMITS } from '@/lib/limits';
import type { School } from '@/types/school';
import { regionName, type SeatSummary } from './school-model';

export interface SchoolOverviewProps {
  school: School;
  seats: SeatSummary;
}

/** The facts of a school, its four numbers and the seat usage. */
export function SchoolOverview({ school, seats }: SchoolOverviewProps) {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const formatDate = useDateFormat();
  const onOff = (value: boolean) => t(value ? 'schools.detail.overview.on' : 'schools.detail.overview.off');
  const facts: { key: string; label: string; value: ReactNode }[] = [
    {
      key: 'country',
      label: t('schools.detail.overview.country'),
      value: (
        <>
          {regionName(school.country, locale)}{' '}
          <span translate="no" className="text-ink-muted">
            ({school.country})
          </span>
        </>
      ),
    },
    { key: 'city', label: t('schools.detail.overview.city'), value: school.city ?? t('shared.noValue') },
    {
      key: 'defaultLocale',
      label: t('schools.detail.overview.defaultLocale'),
      value: tCommon(`locale.names.${school.defaultLocale}`),
    },
    {
      key: 'created',
      label: t('schools.detail.overview.created'),
      value: formatDate(school.createdAt, 'dateLong'),
    },
    { key: 'ai', label: t('schools.detail.overview.ai'), value: onOff(school.settings.aiEnabled) },
    {
      key: 'aiLimit',
      label: t('schools.detail.overview.aiLimit'),
      value:
        school.settings.aiDailyMessageLimit === null
          ? t('schools.detail.overview.aiLimitDefault', { count: AI_LIMITS.tutor.student.perDay })
          : new Intl.NumberFormat(locale).format(school.settings.aiDailyMessageLimit),
    },
    {
      key: 'joinCodes',
      label: t('schools.detail.overview.joinCodes'),
      value: onOff(school.settings.joinCodesEnabled),
    },
  ];

  return (
    <Card as="section" aria-labelledby="overview-title">
      <CardBody className="flex flex-col gap-6">
        <h2 id="overview-title" className="text-xl font-semibold text-ink">
          {t('schools.detail.overview.title')}
        </h2>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {facts.map((fact) => (
            <div key={fact.key} className="min-w-0">
              <dt className="text-sm text-ink-muted">{fact.label}</dt>
              <dd className="font-medium break-words text-ink">{fact.value}</dd>
            </div>
          ))}
        </dl>
        <section aria-label={t('schools.detail.stats.label')}>
          <div className="grid grid-cols-1 gap-4 min-[440px]:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={t('schools.detail.stats.teachers')}
              value={school.counts.teachers}
              icon="GraduationCap"
            />
            <StatCard label={t('schools.detail.stats.students')} value={school.counts.students} icon="Users" />
            <StatCard label={t('schools.detail.stats.classes')} value={school.counts.classes} icon="School" />
            <StatCard
              label={t('schools.detail.stats.seats')}
              value={
                seats.noLicense
                  ? t('schools.detail.stats.seatsNoLicense')
                  : t('schools.detail.stats.seatsValue', { used: seats.used, total: seats.total })
              }
              icon="Gauge"
              tone={seats.over ? 'warning' : 'default'}
            />
          </div>
        </section>
        {seats.over && (
          <Alert tone="warning" live="off">
            {t('schools.detail.stats.overLimit', { used: seats.used, total: seats.total })}
          </Alert>
        )}
      </CardBody>
    </Card>
  );
}
