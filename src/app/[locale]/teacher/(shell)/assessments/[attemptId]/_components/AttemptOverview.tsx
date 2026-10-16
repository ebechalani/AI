import { useTranslations } from 'next-intl';
import { StatCard, useDateFormat } from '@/components/domain';
import type { QuizAttempt } from '@/types/quiz';

export interface AttemptOverviewProps {
  attempt: QuizAttempt;
  /** The language the attempt was answered in, as a name ("French"). */
  languageName: string;
}

/** Score, result, attempt number and when it was sent: four stat cards. */
export function AttemptOverview({ attempt, languageName }: AttemptOverviewProps) {
  const t = useTranslations('assessments');
  const tCommon = useTranslations('common');
  const formatDate = useDateFormat();

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label={t('detail.score')}
        value={tCommon('units.percent', { value: attempt.scorePercent })}
        hint={t('detail.scoreHint', { score: attempt.score, max: attempt.maxScore })}
        icon="target"
      />
      <StatCard
        label={t('detail.result')}
        value={attempt.passed ? t('detail.passed') : t('detail.notPassed')}
        icon={attempt.passed ? 'badge-check' : 'flag'}
        tone={attempt.passed ? 'success' : 'warning'}
      />
      <StatCard
        label={t('detail.attempt')}
        value={t('detail.attemptValue', { number: attempt.attemptNumber })}
        icon="clipboard-check"
      />
      <StatCard
        label={t('detail.submitted')}
        value={formatDate(attempt.submittedAt, 'date')}
        hint={t('detail.submittedHint', {
          time: formatDate(attempt.submittedAt, 'time'),
          language: languageName,
        })}
        icon="calendar"
      />
    </div>
  );
}
