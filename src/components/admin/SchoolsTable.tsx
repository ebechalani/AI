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
import type { School } from '@/types/school';
import { adminSchoolPath } from './paths';
import { regionName } from './school-model';

export interface SchoolsTableProps {
  schools: School[];
}

/** The schools list: name and place, status, the three counts and the creation date. */
export function SchoolsTable({ schools }: SchoolsTableProps) {
  const t = useTranslations('admin');
  const locale = useLocale();
  const formatDate = useDateFormat();
  const number = new Intl.NumberFormat(locale);

  return (
    <Table caption={t('schools.caption')}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t('schools.columns.school')}</TableHeaderCell>
          <TableHeaderCell>{t('schools.columns.status')}</TableHeaderCell>
          <TableHeaderCell align="end">{t('schools.columns.teachers')}</TableHeaderCell>
          <TableHeaderCell align="end">{t('schools.columns.students')}</TableHeaderCell>
          <TableHeaderCell align="end">{t('schools.columns.classes')}</TableHeaderCell>
          <TableHeaderCell>{t('schools.columns.created')}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {schools.map((school) => {
          const country = regionName(school.country, locale);
          return (
            <TableRow key={school.id}>
              <TableHeaderCell scope="row" wrap className="min-w-48 font-normal">
                <Link
                  href={adminSchoolPath(school.id)}
                  className="rounded-sm font-medium break-words text-ink underline-offset-4 hover:text-brand-700 hover:underline"
                >
                  {school.name}
                </Link>
                <span className="block text-sm text-ink-muted">
                  {school.city !== null
                    ? t('schools.location', { city: school.city, country })
                    : country}
                </span>
              </TableHeaderCell>
              <TableCell>
                <StatusChip status={school.status} />
              </TableCell>
              <TableCell align="end" className="tabular-nums">
                {number.format(school.counts.teachers)}
              </TableCell>
              <TableCell align="end" className="tabular-nums">
                {number.format(school.counts.students)}
              </TableCell>
              <TableCell align="end" className="tabular-nums">
                {number.format(school.counts.classes)}
              </TableCell>
              <TableCell className="whitespace-nowrap">{formatDate(school.createdAt)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
