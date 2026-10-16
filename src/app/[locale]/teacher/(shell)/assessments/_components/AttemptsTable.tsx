import { CircleAlert, CircleCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useDateFormat } from '@/components/domain';
import { attemptHref } from '@/components/quiz/assessments-model';
import { own } from '@/components/quiz/quiz-model';
import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import type { QuizAttempt } from '@/types/quiz';

export interface AttemptsTableProps {
  attempts: QuizAttempt[];
  /** Course titles by course id, in the page's locale. */
  courseTitles: Record<string, string>;
  /** "All courses": each row names its course. */
  showCourse: boolean;
  caption: string;
}

/** One page of quiz attempts; the student's name is the row's link to the attempt. */
export function AttemptsTable({ attempts, courseTitles, showCourse, caption }: AttemptsTableProps) {
  const t = useTranslations('assessments');
  const locale = useLocale();
  const formatDate = useDateFormat();

  return (
    <Table caption={caption}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t('list.student')}</TableHeaderCell>
          <TableHeaderCell>{t('list.quiz')}</TableHeaderCell>
          {showCourse && <TableHeaderCell>{t('list.course')}</TableHeaderCell>}
          <TableHeaderCell>{t('list.attempt')}</TableHeaderCell>
          <TableHeaderCell>{t('list.score')}</TableHeaderCell>
          <TableHeaderCell>{t('list.result')}</TableHeaderCell>
          <TableHeaderCell>{t('list.submitted')}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {attempts.map((attempt) => {
          // The title as it was when the attempt was made; its default locale is not stored.
          const quizTitle = pickTranslation(attempt.quizTitle, locale, 'en').title;
          return (
            <TableRow key={attempt.id}>
              <TableHeaderCell scope="row">
                {/* One label that starts with the visible name (WCAG 2.5.3): a visually hidden
                    suffix would be read with a stray space before its comma. */}
                <Link
                  href={attemptHref(attempt.id)}
                  aria-label={t('list.rowLink', {
                    name: attempt.studentName,
                    number: attempt.attemptNumber,
                    quiz: quizTitle,
                  })}
                  className="text-brand-700 underline-offset-4 hover:underline"
                >
                  {attempt.studentName}
                </Link>
              </TableHeaderCell>
              <TableCell className="min-w-44">{quizTitle}</TableCell>
              {showCourse && (
                <TableCell className="min-w-44">
                  {own(courseTitles, attempt.courseId) ?? t('list.unknownCourse')}
                </TableCell>
              )}
              <TableCell className="whitespace-nowrap tabular-nums">
                {t('list.attemptNumber', { number: attempt.attemptNumber })}
              </TableCell>
              <TableCell className="whitespace-nowrap tabular-nums">
                {t('list.scoreValue', {
                  score: attempt.score,
                  max: attempt.maxScore,
                  percent: attempt.scorePercent,
                })}
              </TableCell>
              <TableCell>
                {attempt.passed ? (
                  <Chip tone="success" icon={<CircleCheck aria-hidden="true" />}>
                    {t('list.passed')}
                  </Chip>
                ) : (
                  <Chip tone="warning" icon={<CircleAlert aria-hidden="true" />}>
                    {t('list.notPassed')}
                  </Chip>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDate(attempt.submittedAt, 'dateTime')}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
