import { useTranslations } from 'next-intl';
import { useDateFormat } from '@/components/domain';
import { Card, Chip, LinkButton, ProgressBar } from '@/components/ui';
import type { License } from '@/types/billing';
import type { IsoDateString } from '@/types/common';
import { SCHOOL_PATHS } from './paths';
import { daysUntil, isExpiringSoon, type SeatSummary } from './school-model';

export interface SeatsCardProps {
  title: string;
  seats: SeatSummary;
  /** The active licence that ends last, or null. */
  current: License | null;
  now: IsoDateString;
  /** The dashboard links to the licences page; the licences page does not. */
  showLink: boolean;
  /** A closing explanation (the licences page). */
  explain?: string;
}

/** Seats used out of the licensed total, and until when the current licence runs. */
export function SeatsCard({ title, seats, current, now, showLink, explain }: SeatsCardProps) {
  const t = useTranslations('school');
  const formatDate = useDateFormat();

  return (
    <Card as="section" aria-labelledby="seats-title" className="gap-4 p-5 sm:p-6">
      <h2 id="seats-title" className="text-lg leading-snug font-bold text-ink">
        {title}
      </h2>
      {seats.noLicense ? (
        <p className="text-ink">{t('dashboard.seats.usedNoLicense', { used: seats.used })}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-ink">
            {t('dashboard.seats.used', { used: seats.used, total: seats.total })}
          </p>
          <ProgressBar value={seats.percent} label={t('dashboard.seats.barLabel')} showValue />
        </div>
      )}
      {current !== null && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
          <p>{t('dashboard.seats.validUntil', { date: formatDate(current.endsAt, 'dateLong') })}</p>
          {isExpiringSoon(current, now) && (
            <Chip tone="warning" size="sm">
              {t('dashboard.seats.endsSoon', { days: daysUntil(current.endsAt, now) })}
            </Chip>
          )}
        </div>
      )}
      {showLink && (
        <div>
          <LinkButton href={SCHOOL_PATHS.licenses} variant="secondary" size="sm">
            {t('dashboard.seats.view')}
          </LinkButton>
        </div>
      )}
      {explain && <p className="text-sm text-ink-muted">{explain}</p>}
    </Card>
  );
}
