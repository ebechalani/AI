import { useTranslations } from 'next-intl';
import { StatusChip, useDateFormat } from '@/components/domain';
import type { Submission } from '@/types/project';

export interface SubmissionStatusLineProps {
  submission: Submission;
  /** Adds the grade once the work has one. */
  showScore?: boolean;
}

/** Status chip, attempt number (from the second), the day it was sent, and the grade. */
export function SubmissionStatusLine({ submission, showScore = false }: SubmissionStatusLineProps) {
  const t = useTranslations('domain');
  const formatDate = useDateFormat();
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-ink-muted">
      <StatusChip status={submission.status} />
      {submission.attemptNumber > 1 && (
        <span>{t('project.attempt', { number: submission.attemptNumber })}</span>
      )}
      <span>{t('project.submittedOn', { date: formatDate(submission.submittedAt) })}</span>
      {showScore && submission.finalScore !== null && (
        <span className="font-semibold text-ink tabular-nums">
          {t('project.score', { score: submission.finalScore })}
        </span>
      )}
    </div>
  );
}
