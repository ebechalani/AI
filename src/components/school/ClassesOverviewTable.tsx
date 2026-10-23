import { School } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';
import type { SchoolClass } from '@/types/school';
import { schoolClassPath } from './paths';

/** Students and assigned courses in each active class. */
export function ClassesOverviewTable({ classes }: { classes: SchoolClass[] }) {
  const t = useTranslations('school');
  const locale = useLocale();
  const number = new Intl.NumberFormat(locale);

  if (classes.length === 0) {
    return (
      <EmptyState
        icon={<School />}
        title={t('analytics.classes.empty.title')}
        description={t('analytics.classes.empty.description')}
      />
    );
  }

  return (
    <Table caption={t('analytics.classes.caption')}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t('analytics.classes.class')}</TableHeaderCell>
          <TableHeaderCell>{t('analytics.classes.grade')}</TableHeaderCell>
          <TableHeaderCell align="end">{t('analytics.classes.students')}</TableHeaderCell>
          <TableHeaderCell align="end">{t('analytics.classes.courses')}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {classes.map((cls) => (
          <TableRow key={cls.id}>
            <TableHeaderCell scope="row" wrap className="min-w-40 font-normal">
              <Link
                href={schoolClassPath(cls.id)}
                className="rounded-sm font-medium break-words text-ink underline-offset-4 hover:text-brand-700 hover:underline"
              >
                {cls.name}
              </Link>
            </TableHeaderCell>
            <TableCell>{cls.gradeLabel ?? t('dashboard.stats.noValue')}</TableCell>
            <TableCell align="end" className="tabular-nums">
              {number.format(cls.studentCount)}
            </TableCell>
            <TableCell align="end" className="tabular-nums">
              {number.format(cls.assignedCourseIds.length)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
