import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { StatusChip, useDateFormat } from '@/components/domain';
import { Card, Chip } from '@/components/ui';
import type { License } from '@/types/billing';
import type { IsoDateString } from '@/types/common';
import {
  countsTowardSeats,
  daysUntil,
  isExpiringSoon,
  licenseState,
} from './school-model';

export interface LicenseListProps {
  licenses: License[];
  /** Pathway titles by id, for a licence scoped to pathways. */
  pathwayTitles: Record<string, string>;
  now: IsoDateString;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{label}</dt>
      <dd className="break-words text-ink">{children}</dd>
    </div>
  );
}

/** One card per licence of the school: its state, courses, seats and period. Read-only. */
export function LicenseList({ licenses, pathwayTitles, now }: LicenseListProps) {
  const t = useTranslations('school');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const formatDate = useDateFormat();
  const list = new Intl.ListFormat(locale, { type: 'conjunction' });

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {licenses.map((license) => {
        const state = licenseState(license, now);
        const scope =
          license.scope.type === 'all_official'
            ? t('licenses.scopeAll')
            : t('licenses.scopePathways', {
                names: list.format(license.scope.pathwayIds.map((id) => pathwayTitles[id] ?? id)),
              });
        return (
          <Card as="li" key={license.id} className="gap-3 p-5">
            <h3 className="text-lg leading-snug font-semibold break-words text-ink">
              {license.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              <StatusChip status={state} />
              {isExpiringSoon(license, now) && (
                <Chip tone="warning">
                  {t('licenses.endsSoon', { days: daysUntil(license.endsAt, now) })}
                </Chip>
              )}
            </div>
            <dl className="flex flex-col gap-3 text-sm">
              <Fact label={t('licenses.labels.scope')}>{scope}</Fact>
              <Fact label={t('licenses.labels.seats')}>
                {t('licenses.seatsCount', { count: license.seatsTotal })}
              </Fact>
              <Fact label={t('licenses.labels.period')}>
                {tCommon('dates.range', {
                  start: formatDate(license.startsAt, 'dateLong'),
                  end: formatDate(license.endsAt, 'dateLong'),
                })}
              </Fact>
            </dl>
            {!countsTowardSeats(license, now) && (
              <p className="text-sm text-ink-muted">{t('licenses.countsNote')}</p>
            )}
          </Card>
        );
      })}
    </ul>
  );
}
