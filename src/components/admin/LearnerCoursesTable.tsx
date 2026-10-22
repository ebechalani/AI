import { useLocale, useTranslations } from 'next-intl';
import { IssueCertificateButton } from '@/components/certificates/IssueCertificateButton';
import { StatusChip } from '@/components/domain';
import {
  ProgressBar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import type { Course } from '@/types/content';
import type { Enrollment } from '@/types/learning';

export interface LearnerCoursesTableProps {
  learnerName: string;
  /** Each enrollment with its course, or null when the course is gone or hidden. */
  rows: { enrollment: Enrollment; course: Course | null }[];
}

/** One learner's enrollments, each with WS-J's view / issue control (ARCHITECTURE.md 9.5). */
export function LearnerCoursesTable({ learnerName, rows }: LearnerCoursesTableProps) {
  const t = useTranslations('admin');
  const locale = useLocale();

  return (
    <Table caption={t('certificates.learner.coursesCaption', { name: learnerName })}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t('certificates.learner.columns.course')}</TableHeaderCell>
          <TableHeaderCell>{t('certificates.learner.columns.progress')}</TableHeaderCell>
          <TableHeaderCell>{t('certificates.learner.columns.status')}</TableHeaderCell>
          <TableHeaderCell align="end">{t('certificates.learner.columns.certificate')}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map(({ enrollment, course }) => (
          <TableRow key={enrollment.id}>
            <TableHeaderCell scope="row" wrap className="min-w-48 font-normal">
              {course === null ? (
                <span className="text-ink-muted">{t('certificates.learner.hiddenCourse')}</span>
              ) : (
                <span className="font-medium break-words text-ink">
                  {pickTranslation(course.translations, locale, course.defaultLocale).title}
                </span>
              )}
            </TableHeaderCell>
            <TableCell>
              <div className="w-32">
                <ProgressBar
                  value={enrollment.progressPercent}
                  showValue
                  size="sm"
                  label={t('certificates.learner.columns.progress')}
                />
              </div>
            </TableCell>
            <TableCell>
              <StatusChip status={enrollment.status === 'completed' ? 'completed' : 'in_progress'} />
            </TableCell>
            <TableCell align="end">
              {course === null ? (
                <span className="text-ink-muted">{t('shared.noValue')}</span>
              ) : !course.certificateEnabled ? (
                <span className="text-sm text-ink-muted">{t('certificates.learner.certificatesOff')}</span>
              ) : (
                <IssueCertificateButton
                  studentUid={enrollment.userUid}
                  courseId={enrollment.courseId}
                  existingCertificateId={enrollment.certificateId}
                />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
