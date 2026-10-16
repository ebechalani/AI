import { useId } from 'react';
import { Clock, Sparkles, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert, Card, Chip } from '@/components/ui';
import { AI_LIMITS } from '@/lib/limits';
import type { AiReview, Submission } from '@/types/project';
import { AiSuggestionDetails } from './AiSuggestionDetails';
import { CheckAgainButton } from './CheckAgainButton';
import { RefocusHeading } from './RefocusHeading';
import { RegenerateAiReviewButton } from './RegenerateAiReviewButton';

const FAILURE_REASONS = [
  'incomplete',
  'refused',
  'blocked',
  'invalid_output',
  'provider_error',
] as const;

export interface AiSuggestionProps {
  submission: Submission;
  aiReview: AiReview | null;
  /** Fewer than three new suggestions asked so far. */
  canRegenerate: boolean;
}

function AiState({ submission, aiReview }: Pick<AiSuggestionProps, 'submission' | 'aiReview'>) {
  const t = useTranslations('review');
  if (submission.aiReviewStatus === 'pending') {
    return (
      <Alert
        tone="info"
        live="off"
        title={t('ai.pending.title')}
        action={<CheckAgainButton label={t('ai.checkAgain')} />}
      >
        <span className="flex items-center gap-1.5">
          <Clock aria-hidden="true" className="size-4 shrink-0" />
          {t('ai.pending.description')}
        </span>
      </Alert>
    );
  }
  if (submission.aiReviewStatus === 'skipped') {
    return (
      <Alert tone="warning" live="off" title={t('ai.skipped.title')}>
        {t('ai.skipped.description')}
      </Alert>
    );
  }
  if (submission.aiReviewStatus === 'failed' || aiReview?.status === 'failed') {
    const reason = FAILURE_REASONS.find((known) => known === aiReview?.error);
    return (
      <Alert tone="warning" live="off" title={t('ai.failed.title')}>
        {reason === undefined ? t('ai.failed.generic') : t(`ai.failed.reasons.${reason}`)}
      </Alert>
    );
  }
  if (aiReview === null) return <p className="text-sm text-ink-muted">{t('ai.none')}</p>;
  return <AiSuggestionDetails submission={submission} aiReview={aiReview} />;
}

/**
 * The AI suggestion on the review screen (SPEC-D 5.4): a suggestion only, the teacher decides.
 * Its heading takes focus back after a new suggestion or Check again changed it.
 */
export function AiSuggestion({ submission, aiReview, canRegenerate }: AiSuggestionProps) {
  const t = useTranslations('review');
  const titleId = useId();
  const max = AI_LIMITS.review.maxRegenerations;
  const open = submission.status === 'submitted' && submission.aiReviewStatus !== 'pending';

  return (
    <Card as="section" aria-labelledby={titleId} className="gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <RefocusHeading
          as="h2"
          id={titleId}
          focusKey={`${submission.aiReviewStatus}/${submission.aiRegenerations}/${submission.latestAiReviewId}`}
          className="text-lg font-semibold text-ink"
        >
          {t('ai.title')}
        </RefocusHeading>
        <Chip tone="brand" icon={<Sparkles aria-hidden="true" />}>
          {t('ai.label')}
        </Chip>
      </div>
      <p className="-mt-2 text-sm text-ink-muted">{t('ai.disclaimer')}</p>

      <AiState submission={submission} aiReview={aiReview} />

      {open && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4">
          {canRegenerate ? (
            <>
              <RegenerateAiReviewButton submissionId={submission.id} audience="teacher" />
              <span className="text-sm text-ink-muted">
                {t('ai.regenerations', { used: submission.aiRegenerations, max })}
              </span>
            </>
          ) : (
            <p className="flex items-center gap-1.5 text-sm text-ink-muted">
              <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
              {t('ai.noRegenerations')}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
