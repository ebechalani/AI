import { CircleAlert, CircleCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useDateFormat } from '@/components/domain';
import { Chip } from '@/components/ui';
import type { Quiz, QuizAttempt } from '@/types/quiz';
import { AttemptReview } from './AttemptReview';
import { reviewRows } from './quiz-model';

export interface LatestAttemptProps {
  quiz: Quiz;
  attempt: QuizAttempt;
}

/**
 * The learner's last attempt on the intro. Its review shows marks and points only when the
 * server revealed the results; the right answers and explanations come only with a fresh result.
 */
export function LatestAttempt({ quiz, attempt }: LatestAttemptProps) {
  const t = useTranslations('quiz');
  const locale = useLocale();
  const formatDate = useDateFormat();
  const rows = reviewRows({ quiz, attempt, correctOptionIds: null, explanations: null, locale });

  return (
    <div className="flex flex-col gap-2 rounded-card border border-border bg-surface-muted/50 p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h4 className="font-semibold text-ink">{t('latest.title')}</h4>
        {attempt.passed ? (
          <Chip tone="success" icon={<CircleCheck aria-hidden="true" />}>
            {t('latest.passed')}
          </Chip>
        ) : (
          <Chip tone="warning" icon={<CircleAlert aria-hidden="true" />}>
            {t('latest.notPassed')}
          </Chip>
        )}
      </div>
      <p className="text-sm text-ink-muted tabular-nums">
        {t('latest.summary', {
          number: attempt.attemptNumber,
          percent: attempt.scorePercent,
          date: formatDate(attempt.submittedAt, 'dateTime'),
        })}
      </p>
      {rows.length > 0 && (
        <details className="mt-1">
          <summary className="min-h-11 cursor-pointer py-2.5 font-semibold text-brand-700">
            {t('latest.review')}
          </summary>
          <div className="mt-2">
            <AttemptReview rows={rows} perspective="learner" headingAs="h5" />
          </div>
        </details>
      )}
    </div>
  );
}
