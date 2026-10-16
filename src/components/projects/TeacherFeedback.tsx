import { MessageSquareText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDateFormat } from '@/components/domain';
import { Card } from '@/components/ui';
import type { Submission } from '@/types/project';
import { CriteriaList } from './CriteriaList';
import { rubricRows } from './review-model';

export interface TeacherFeedbackProps {
  /** Approved, or returned by a teacher. */
  submission: Submission;
  headingLevel?: 'h2' | 'h3';
}

/** The teacher's decision as the student reads it: score, criteria and feedback. */
export function TeacherFeedback({ submission, headingLevel: Heading = 'h2' }: TeacherFeedbackProps) {
  const t = useTranslations('projects');
  const tDomain = useTranslations('domain');
  const formatDate = useDateFormat();
  const { finalCriteria, finalScore, finalFeedback, reviewedAt } = submission;
  const rows =
    finalCriteria === null
      ? []
      : rubricRows(submission.rubric)
          .filter((row) => row.weight > 0)
          .map((row) => ({ ...row, score: finalCriteria[row.key] }));

  return (
    <Card as="section" className="gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Heading className="flex items-center gap-2 text-lg font-semibold text-ink">
          <MessageSquareText aria-hidden="true" className="size-5 shrink-0 text-brand-600" />
          {t('feedback.teacher.title')}
        </Heading>
        {submission.status === 'approved' && finalScore !== null && (
          <p className="text-base font-semibold text-ink tabular-nums">
            {tDomain('project.score', { score: finalScore })}
          </p>
        )}
      </div>
      {finalFeedback && (
        <p className="text-base break-words whitespace-pre-wrap text-ink">{finalFeedback}</p>
      )}
      {rows.length > 0 && <CriteriaList rows={rows} showScores />}
      {reviewedAt !== null && (
        <p className="text-sm text-ink-muted">
          {t('feedback.teacher.reviewedOn', { date: formatDate(reviewedAt, 'dateLong') })}
        </p>
      )}
    </Card>
  );
}
