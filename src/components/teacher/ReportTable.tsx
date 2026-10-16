import { useLocale, useTranslations } from 'next-intl';
import { IssueCertificateButton } from '@/components/certificates/IssueCertificateButton';
import { StatusChip, useDateFormat } from '@/components/domain';
import {
  Chip,
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
import type { ClassReport, ClassReportRow } from '@/types/analytics';
import type { Course } from '@/types/content';
import { studentPath } from './paths';
import { certificateCell, rowStatus } from './reports-model';

// The eight columns fit a 1366 px laptop (7.2) only if the headers and the student names may
// wrap. The primitive keeps a header on one line, and `cn` does not resolve conflicting
// utilities, so the override needs `!` (WS-E-4).
const HEAD = 'whitespace-normal!';

export interface ReportTableProps {
  report: ClassReport;
}

function StatusCell({ row }: { row: ClassReportRow }) {
  const t = useTranslations('reports');
  const status = rowStatus(row.enrollment);
  if (status === 'completed') return <StatusChip status="completed" />;
  if (status === 'inProgress') return <StatusChip status="in_progress" />;
  return (
    <Chip>{status === 'notStarted' ? t('table.statusNotStarted') : t('table.statusNotEnrolled')}</Chip>
  );
}

function CertificateCellView({ course, row }: { course: Course; row: ClassReportRow }) {
  const t = useTranslations('reports');
  const cell = certificateCell(course, row);
  switch (cell.kind) {
    case 'issued':
    case 'issue':
      return (
        <IssueCertificateButton
          studentUid={row.student.uid}
          courseId={course.id}
          existingCertificateId={row.certificateId}
        />
      );
    case 'notCompleted':
      return <span className="text-sm text-ink-muted">{t('table.certificateNotCompleted')}</span>;
    case 'notEnrolled':
      return <span className="text-sm text-ink-muted">{t('table.certificateNotEnrolled')}</span>;
    default:
      return null;
  }
}

/** One row per student of the class: progress, status, quizzes, projects and certificate. */
export function ReportTable({ report }: ReportTableProps) {
  const t = useTranslations('reports');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const formatDate = useDateFormat();
  const { cls, course, rows } = report;
  const courseTitle = pickTranslation(course.translations, locale, course.defaultLocale).title;
  // The column is left out when no row can have a certificate.
  const certificatesOff = rows.every((row) => certificateCell(course, row).kind === 'disabled');

  return (
    <div className="flex flex-col gap-3">
      {certificatesOff && <p className="text-sm text-ink-muted">{t('table.certificatesOff')}</p>}
      <Table caption={t('table.caption', { className: cls.name, course: courseTitle })}>
        <TableHead>
          <TableRow>
            <TableHeaderCell className={HEAD}>{t('table.student')}</TableHeaderCell>
            <TableHeaderCell className={HEAD}>{t('table.progress')}</TableHeaderCell>
            <TableHeaderCell className={HEAD}>{t('table.lessons')}</TableHeaderCell>
            <TableHeaderCell className={HEAD}>{t('table.status')}</TableHeaderCell>
            <TableHeaderCell align="end" className={HEAD}>
              {t('table.quizAverage')}
            </TableHeaderCell>
            <TableHeaderCell className={HEAD}>{t('table.projects')}</TableHeaderCell>
            <TableHeaderCell className={HEAD}>{t('table.lastActivity')}</TableHeaderCell>
            {!certificatesOff && (
              <TableHeaderCell className={HEAD}>{t('table.certificate')}</TableHeaderCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const { enrollment } = row;
            const name = row.student.displayName;
            return (
              <TableRow key={row.student.uid}>
                <TableHeaderCell scope="row" className="font-normal whitespace-normal!">
                  <Link
                    href={studentPath(cls.id, row.student.uid)}
                    className="rounded-sm font-medium break-words underline-offset-4 hover:text-brand-700 hover:underline"
                  >
                    {name}
                  </Link>
                </TableHeaderCell>
                <TableCell className="min-w-32">
                  <ProgressBar
                    size="sm"
                    value={enrollment?.progressPercent ?? 0}
                    label={name}
                    showValue
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {enrollment === null
                    ? t('table.none')
                    : t('table.lessonCount', {
                        completed: enrollment.completedLessonCount,
                        total: Math.max(
                          enrollment.totalLessonCount,
                          enrollment.completedLessonCount,
                        ),
                      })}
                </TableCell>
                <TableCell>
                  <StatusCell row={row} />
                </TableCell>
                <TableCell align="end" className="whitespace-nowrap tabular-nums">
                  {row.quizAveragePercent === null
                    ? t('table.none')
                    : tCommon('units.percent', { value: row.quizAveragePercent })}
                </TableCell>
                <TableCell>
                  {t('table.projectsValue', {
                    approved: row.submissionsApproved,
                    pending: row.submissionsPending,
                  })}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {enrollment === null ? t('table.none') : formatDate(enrollment.lastActivityAt)}
                </TableCell>
                {!certificatesOff && (
                  <TableCell>
                    <CertificateCellView course={course} row={row} />
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
