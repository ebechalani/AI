import { ClipboardCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useDateFormat } from '@/components/domain';
import { Chip, EmptyState, LinkButton } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import type { QuizAttempt } from '@/types/quiz';
import { assessmentsPath, attemptPath } from './paths';

export interface RecentQuizResultsProps {
  /** Newest first. */
  attempts: QuizAttempt[];
  /** classId → name, archived classes included. */
  classNames: Record<string, string>;
  /** The "all results" link opens this class's assessments; none without an active class. */
  firstActiveClassId: string | null;
}

export function RecentQuizResults({
  attempts,
  classNames,
  firstActiveClassId,
}: RecentQuizResultsProps) {
  const t = useTranslations('teacher');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const formatDate = useDateFormat();

  return (
    <section aria-labelledby="dashboard-quizzes-title" className="flex min-w-0 flex-col gap-3">
      <h2 id="dashboard-quizzes-title" className="text-xl font-bold text-ink">
        {t('dashboard.quizzes.title')}
      </h2>
      {attempts.length === 0 ? (
        <EmptyState
          variant="plain"
          icon={<ClipboardCheck />}
          title={t('dashboard.quizzes.empty.title')}
          description={t('dashboard.quizzes.empty.description')}
          className="py-6"
        />
      ) : (
        <ol aria-label={t('dashboard.quizzes.listLabel')} className="divide-y divide-border">
          {attempts.map((attempt) => {
            const quiz = pickTranslation(attempt.quizTitle, locale, attempt.locale).title;
            return (
              <li
                key={attempt.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <Link
                    href={attemptPath(attempt.id)}
                    className="rounded-sm font-medium break-words text-ink underline-offset-4 hover:text-brand-700 hover:underline"
                  >
                    {t('dashboard.quizzes.row', { name: attempt.studentName, quiz })}
                  </Link>
                  <p className="text-sm text-ink-muted">
                    {(attempt.classId !== null ? classNames[attempt.classId] : undefined) ??
                      t('dashboard.quizzes.unknownClass')}{' '}
                    · {formatDate(attempt.submittedAt)}
                  </p>
                </div>
                <Chip tone={attempt.passed ? 'success' : 'warning'}>
                  {tCommon('units.percent', { value: attempt.scorePercent })}
                  <span className="sr-only">
                    {' '}
                    (
                    {attempt.passed
                      ? t('dashboard.quizzes.passed')
                      : t('dashboard.quizzes.failed')}
                    )
                  </span>
                </Chip>
              </li>
            );
          })}
        </ol>
      )}
      {firstActiveClassId !== null && attempts.length > 0 && (
        <div>
          <LinkButton href={assessmentsPath(firstActiveClassId)} variant="ghost" size="sm">
            {t('dashboard.quizzes.viewAll')}
          </LinkButton>
        </div>
      )}
    </section>
  );
}
