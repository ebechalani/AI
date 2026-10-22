import { useLocale, useTranslations } from 'next-intl';
import { StatusChip, useDateFormat } from '@/components/domain';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';
import type { License } from '@/types/billing';
import type { IsoDateString } from '@/types/common';
import type { PathwayChoice, SubscriptionOption } from './billing-model';
import { LicenseButton } from './LicenseButton';
import { adminSchoolPath } from './paths';
import { licenseState } from './school-model';

export interface LicensesTableProps {
  licenses: License[];
  schoolNames: Record<string, string>;
  pathwayTitles: Record<string, string>;
  showSchool: boolean;
  now: IsoDateString;
  pathways: PathwayChoice[];
  /** The school's subscriptions a licence may link to; null hides the field (the global list). */
  subscriptionOptions: SubscriptionOption[] | null;
}

const LINK_CLASSES =
  'rounded-sm text-brand-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

/** The licences list: name, school, what it opens, seats, validity, state and Edit. */
export function LicensesTable({
  licenses,
  schoolNames,
  pathwayTitles,
  showSchool,
  now,
  pathways,
  subscriptionOptions,
}: LicensesTableProps) {
  const t = useTranslations('admin');
  const locale = useLocale();
  const formatDate = useDateFormat();
  const list = new Intl.ListFormat(locale, { type: 'conjunction' });

  function scopeText(license: License): string {
    if (license.scope.type === 'all_official') return t('billing.licenses.scopeAll');
    return t('billing.licenses.scopePathways', {
      count: license.scope.pathwayIds.length,
      names: list.format(
        license.scope.pathwayIds.map((id) => pathwayTitles[id] ?? t('billing.licenses.unknownPathway')),
      ),
    });
  }

  return (
    <Table caption={t('billing.licenses.caption')}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t('billing.licenses.columns.license')}</TableHeaderCell>
          {showSchool && <TableHeaderCell>{t('billing.licenses.columns.school')}</TableHeaderCell>}
          <TableHeaderCell>{t('billing.licenses.columns.scope')}</TableHeaderCell>
          <TableHeaderCell align="end">{t('billing.licenses.columns.seats')}</TableHeaderCell>
          <TableHeaderCell>{t('billing.licenses.columns.dates')}</TableHeaderCell>
          <TableHeaderCell>{t('billing.licenses.columns.status')}</TableHeaderCell>
          <TableHeaderCell align="end">{t('billing.licenses.columns.actions')}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {licenses.map((license) => (
          <TableRow key={license.id}>
            <TableHeaderCell scope="row" wrap className="min-w-48 font-normal">
              <span className="block font-medium break-words text-ink">{license.name}</span>
              {license.subscriptionId !== null && (
                <span className="block text-sm text-ink-muted">{t('billing.licenses.linked')}</span>
              )}
            </TableHeaderCell>
            {showSchool && (
              <TableCell className="min-w-40">
                <Link href={adminSchoolPath(license.schoolId)} className={LINK_CLASSES}>
                  {schoolNames[license.schoolId] ?? t('shared.unknownSchool')}
                </Link>
              </TableCell>
            )}
            <TableCell className="min-w-48">
              <span className="block break-words">{scopeText(license)}</span>
            </TableCell>
            <TableCell align="end" className="tabular-nums">
              {t('billing.licenses.seats', { total: license.seatsTotal })}
            </TableCell>
            <TableCell className="whitespace-nowrap">
              {t('shared.dateRange', {
                start: formatDate(license.startsAt),
                end: formatDate(license.endsAt),
              })}
            </TableCell>
            <TableCell>
              <StatusChip status={licenseState(license, now)} />
            </TableCell>
            <TableCell align="end">
              <LicenseButton
                mode="edit"
                license={license}
                schoolId={license.schoolId}
                schoolName={schoolNames[license.schoolId]}
                schools={[]}
                pathways={pathways}
                subscriptionOptions={subscriptionOptions}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
