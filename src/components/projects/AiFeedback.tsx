import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, Chip } from '@/components/ui';
import type { AiReview, AiReviewFlag, Submission } from '@/types/project';
import { CriteriaList } from './CriteriaList';
import { rubricRows } from './review-model';

/** The flags that make the unsupervised flow return work (3.4), in the student's words. */
const RETURN_REASONS: readonly AiReviewFlag[] = [
  'off_topic',
  'unsafe_content',
  'possible_prompt_injection',
];

export interface AiFeedbackProps {
  /** A ready review of unsupervised work the AI has closed (accepted or returned). */
  aiReview: AiReview;
  submission: Submission;
}

function TextList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="flex list-disc flex-col gap-1 ps-5 text-base text-ink marker:text-ink-muted">
        {items.map((item, index) => (
          <li key={index} className="break-words whitespace-pre-wrap">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Robo AI's feedback for a learner without a teacher (SPEC-D 5.4): advice in plain text, never
 * Markdown, and no numeric score (3.4: no score is recorded as a grade).
 */
export function AiFeedback({ aiReview, submission }: AiFeedbackProps) {
  const t = useTranslations('projects');
  const reasons = aiReview.flags.filter((flag) => RETURN_REASONS.includes(flag));
  const returned = submission.status === 'returned' && submission.reviewedByUid === null;
  const criteria = aiReview.criteria;
  const rows =
    criteria === null
      ? []
      : rubricRows(submission.rubric)
          .filter((row) => row.weight > 0)
          .map((row) => ({ ...row, score: null, comment: criteria[row.key].comment }));

  return (
    <Card as="section" className="gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="text-lg font-semibold text-ink">{t('ai.student.title')}</h2>
        <Chip tone="brand" icon={<Sparkles aria-hidden="true" />}>
          {t('ai.label')}
        </Chip>
      </div>
      <p className="text-sm text-ink-muted">{t('ai.student.disclaimer')}</p>

      {returned && (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-semibold text-ink">{t('ai.returnReasons.title')}</h3>
          <ul className="flex list-disc flex-col gap-1 ps-5 text-base text-ink">
            {reasons.length > 0 ? (
              reasons.map((flag) => <li key={flag}>{t(`ai.returnReasons.${flag}`)}</li>)
            ) : (
              <li>{t('ai.returnReasons.empty')}</li>
            )}
          </ul>
        </div>
      )}

      {aiReview.writtenFeedback && (
        <p className="text-base break-words whitespace-pre-wrap text-ink">
          {aiReview.writtenFeedback}
        </p>
      )}
      <TextList title={t('ai.strengths')} items={aiReview.strengths} />
      <TextList title={t('ai.improvements')} items={aiReview.improvements} />
      {rows.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-ink">{t('ai.criteria')}</h3>
          <CriteriaList rows={rows} showScores={false} />
        </div>
      )}
      <TextList title={t('ai.limitations')} items={aiReview.limitations} />
    </Card>
  );
}
