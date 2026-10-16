import type { Ref } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StatusChip, useDateFormat } from '@/components/domain';
import { Card, Chip, LinkButton } from '@/components/ui';
import type { Submission, TeacherReview } from '@/types/project';
import { CriteriaList } from './CriteriaList';
import { rubricRows } from './review-model';

export interface ReviewOutcomeProps {
  submission: Submission;
  /** The latest teacher review, or null (work closed without a teacher). */
  review: TeacherReview | null;
  headingLevel: 'h2' | 'h3';
  /** The heading takes focus once a decision was recorded (ReviewPanel). */
  headingRef?: Ref<HTMLHeadingElement>;
}

/** The decision as it was recorded: grade, criteria, feedback, who and when, XP. */
export function ReviewOutcome({
  submission,
  review,
  headingLevel: Heading,
  headingRef,
}: ReviewOutcomeProps) {
  const t = useTranslations('review');
  const tDomain = useTranslations('domain');
  const formatDate = useDateFormat();
  const criteria = submission.finalCriteria;
  const rows =
    criteria === null
      ? []
      : rubricRows(submission.rubric).map((row) => ({ ...row, score: criteria[row.key] }));
  const decidedAt = submission.reviewedAt ?? review?.createdAt ?? null;

  return (
    <Card as="section" className="gap-4 p-5 sm:p-6">
      <Heading
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-semibold text-ink outline-none"
      >
        {t('outcome.title')}
      </Heading>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {review === null ? (
          <StatusChip status={submission.status} />
        ) : (
          <Chip tone={review.decision === 'return' ? 'warning' : 'success'} size="md">
            {t(`decisions.${review.decision}`)}
          </Chip>
        )}
        {submission.finalScore !== null && (
          <span className="text-base font-semibold text-ink tabular-nums">
            {tDomain('project.score', { score: submission.finalScore })}
          </span>
        )}
      </div>
      {rows.length > 0 && <CriteriaList rows={rows} showScores />}
      {submission.finalFeedback && (
        <p className="text-sm break-words whitespace-pre-wrap text-ink">
          {submission.finalFeedback}
        </p>
      )}
      {review !== null && decidedAt !== null && (
        <p className="text-sm text-ink-muted">
          {t('outcome.by', { name: review.reviewerName, date: formatDate(decidedAt, 'dateLong') })}
        </p>
      )}
      {submission.xpAwarded > 0 && (
        <p className="text-sm font-medium text-ink">
          {t('outcome.xp', { xp: submission.xpAwarded })}
        </p>
      )}
      <div>
        <LinkButton href="/teacher/projects" variant="secondary">
          <ArrowLeft aria-hidden="true" className="rtl:rotate-180" />
          {t('outcome.backToQueue')}
        </LinkButton>
      </div>
    </Card>
  );
}
