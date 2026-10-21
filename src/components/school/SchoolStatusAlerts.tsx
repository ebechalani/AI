import { useTranslations } from 'next-intl';
import { Alert, LinkButton } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { School } from '@/types/school';
import type { SeatSummary } from './school-model';

export interface SchoolStatusAlertsProps {
  status: School['status'];
  /** null where seats are not the subject (the settings page): only the suspended alert. */
  seats: SeatSummary | null;
  contactEmail: string | null;
  className?: string;
}

/** What the admin should know first: a suspended school, more students than seats, no licence. */
export function SchoolStatusAlerts({ status, seats, contactEmail, className }: SchoolStatusAlertsProps) {
  const t = useTranslations('school');
  const contact =
    contactEmail === null ? undefined : (
      <LinkButton href={`mailto:${contactEmail}`} variant="secondary" size="sm">
        {t('alerts.contact')}
      </LinkButton>
    );
  const suspended = status === 'suspended';
  const over = seats?.over ?? false;
  const noLicense = seats?.noLicense ?? false;
  if (!suspended && !over && !noLicense) return null;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {suspended && (
        <Alert tone="warning" live="off" title={t('alerts.suspendedTitle')} action={contact}>
          {t('alerts.suspended')}
        </Alert>
      )}
      {seats !== null && over && (
        <Alert tone="warning" live="off" title={t('alerts.overLimitTitle')} action={contact}>
          {t('alerts.overLimit', { used: seats.used, total: seats.total })}
        </Alert>
      )}
      {noLicense && (
        <Alert tone="info" live="off" title={t('alerts.noLicenseTitle')} action={contact}>
          {t('alerts.noLicense')}
        </Alert>
      )}
    </div>
  );
}
