import { ClipboardCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useDateFormat } from '@/components/domain';
import {
  Chip,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui';
import { assessmentsPath, attemptPath } from '@/components/teacher/paths';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import type { QuizAttempt } from '@/types/quiz';

export interface StudentAttemptsTableProps {
  attempts: QuizAttempt[];
  /** courseId → title, for the courses the teacher may read. */
  courseTitles: Record<string, string>;
  studentName: string;
  className: string;
  classId: string;
  /** How many attempts were asked for: a full page says there may be more. */
  limit: number;
}

/** The student's quiz attempts in this class, newest first. */
export function StudentAttemptsTable({
  attempts,
  courseTitles,
  studentName,
  className,
  classId,
  limit,
}: StudentAttemptsTableProps) {
  const t = useTranslations('classes');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const formatDate = useDateFormat();

  return (
    <section aria-labelledby="student-attempts-title" className="flex min-w-0 flex-col gap-4">
      <h2 id="student-attempts-title" className="text-xl font-bold text-ink">
        {t('student.attempts.title')}
      </h2>
      {attempts.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck />}
          title={t('student.attempts.empty.title')}
          description={t('student.attempts.empty.description')}
        />
      ) : (
        <>
          <Table caption={t('student.attempts.caption', { name: studentName, className })}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t('student.attempts.quiz')}</TableHeaderCell>
                <TableHeaderCell>{t('student.attempts.course')}</TableHeaderCell>
                <TableHeaderCell>{t('student.attempts.attempt')}</TableHeaderCell>
                <TableHeaderCell align="end">{t('student.attempts.score')}</TableHeaderCell>
                <TableHeaderCell>{t('student.attempts.result')}</TableHeaderCell>
                <TableHeaderCell>{t('student.attempts.date')}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attempts.map((attempt) => (
                <TableRow key={attempt.id}>
                  <TableHeaderCell scope="row" className="min-w-40 font-normal whitespace-normal!">
                    <Link
                      href={attemptPath(attempt.id)}
                      className="rounded-sm font-medium break-words underline-offset-4 hover:text-brand-700 hover:underline"
                    >
                      {pickTranslation(attempt.quizTitle, locale, attempt.locale).title}
                    </Link>
                  </TableHeaderCell>
                  {/* No minimum width: the course wraps, so the six columns fit the two-thirds
                      column of a 1366 px laptop (7.2). */}
                  <TableCell>
                    {courseTitles[attempt.courseId] ?? t('student.progress.unavailable')}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {t('student.attempts.number', { number: attempt.attemptNumber })}
                  </TableCell>
                  <TableCell align="end" className="whitespace-nowrap tabular-nums">
                    {tCommon('units.percent', { value: attempt.scorePercent })}
                  </TableCell>
                  <TableCell>
                    {attempt.passed ? (
                      <Chip tone="success">{t('student.attempts.passed')}</Chip>
                    ) : (
                      <Chip tone="warning">{t('student.attempts.failed')}</Chip>
                    )}
                  </TableCell>
                  {/* The time goes under the date where the column is narrow. */}
                  <TableCell>
                    <time dateTime={attempt.submittedAt}>
                      <span className="whitespace-nowrap">{formatDate(attempt.submittedAt)}</span>{' '}
                      <span className="whitespace-nowrap">
                        {formatDate(attempt.submittedAt, 'time')}
                      </span>
                    </time>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {attempts.length >= limit && (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
              {t('student.attempts.more', { count: limit })}
              <Link
                href={assessmentsPath(classId)}
                className="rounded-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
              >
                {t('student.attempts.viewAll')}
              </Link>
            </p>
          )}
        </>
      )}
    </section>
  );
}
