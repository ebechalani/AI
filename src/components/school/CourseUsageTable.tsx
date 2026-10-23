import { ChartColumn } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { CertifiedBadge } from '@/components/domain';
import {
  EmptyState,
  LinkButton,
  ProgressBar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import type { CourseUsageRow } from '@/types/analytics';
import { SCHOOL_PATHS, schoolCoursePath } from './paths';

/** Enrollments, completions and completion rate per course assigned in the school. */
export function CourseUsageTable({ rows }: { rows: CourseUsageRow[] }) {
  const t = useTranslations('school');
  const locale = useLocale();
  const number = new Intl.NumberFormat(locale);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<ChartColumn />}
        title={t('analytics.usage.empty.title')}
        description={t('analytics.usage.empty.description')}
        action={
          <LinkButton href={SCHOOL_PATHS.classes} variant="secondary">
            {t('analytics.usage.empty.action')}
          </LinkButton>
        }
      />
    );
  }

  return (
    <Table caption={t('analytics.usage.caption')}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t('analytics.usage.course')}</TableHeaderCell>
          <TableHeaderCell align="end">{t('analytics.usage.enrolled')}</TableHeaderCell>
          <TableHeaderCell align="end">{t('analytics.usage.completed')}</TableHeaderCell>
          <TableHeaderCell>{t('analytics.usage.rate')}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => {
          const title = pickTranslation(
            row.course.translations,
            locale,
            row.course.defaultLocale,
          ).title;
          return (
            <TableRow key={row.courseId}>
              <TableHeaderCell scope="row" wrap className="min-w-48 font-normal">
                <span className="flex flex-wrap items-center gap-2">
                  <Link
                    href={schoolCoursePath(row.courseId)}
                    className="min-w-0 rounded-sm font-medium break-words text-ink underline-offset-4 hover:text-brand-700 hover:underline"
                  >
                    {title}
                  </Link>
                  {row.course.isOfficial && <CertifiedBadge size="sm" />}
                </span>
              </TableHeaderCell>
              <TableCell align="end" className="tabular-nums">
                {number.format(row.enrollments)}
              </TableCell>
              <TableCell align="end" className="tabular-nums">
                {number.format(row.completed)}
              </TableCell>
              <TableCell className="min-w-40">
                <ProgressBar
                  value={row.completionRatePercent}
                  showValue
                  size="sm"
                  label={t('analytics.usage.rateLabel', { course: title })}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
