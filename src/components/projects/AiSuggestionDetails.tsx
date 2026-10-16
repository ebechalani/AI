import { useTranslations } from 'next-intl';
import { Alert, Chip, type ChipTone } from '@/components/ui';
import type { AiConfidence, AiReview, Submission } from '@/types/project';
import { CriteriaList } from './CriteriaList';
import { rubricRows } from './review-model';

const CONFIDENCE_TONES: Record<AiConfidence, ChipTone> = {
  low: 'warning',
  medium: 'neutral',
  high: 'success',
};

function TextList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="flex list-disc flex-col gap-1 ps-5 text-sm text-ink marker:text-ink-muted">
        {items.map((item, index) => (
          <li key={index} className="break-words whitespace-pre-wrap">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface AiSuggestionDetailsProps {
  submission: Submission;
  /** A ready review. */
  aiReview: AiReview;
}

/** A ready AI suggestion for the teacher: score, confidence, points to check, text, criteria. */
export function AiSuggestionDetails({ submission, aiReview }: AiSuggestionDetailsProps) {
  const t = useTranslations('review');
  const criteria = aiReview.criteria;
  const rows =
    criteria === null
      ? []
      : rubricRows(submission.rubric).map((row) => ({
          ...row,
          score: criteria[row.key].score,
          comment: criteria[row.key].comment,
        }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {aiReview.overallSuggestedScore !== null && (
          <p className="text-lg font-semibold text-ink tabular-nums">
            {t('ai.overall', { score: aiReview.overallSuggestedScore })}
          </p>
        )}
        {aiReview.confidence !== null && (
          <Chip tone={CONFIDENCE_TONES[aiReview.confidence]}>
            {t(`ai.confidence.${aiReview.confidence}`)}
          </Chip>
        )}
      </div>

      {aiReview.flags.length > 0 && (
        <Alert tone="warning" live="off">
          <h3 className="font-semibold">{t('ai.flags.title')}</h3>
          <ul className="mt-1 flex list-disc flex-col gap-1 ps-5">
            {aiReview.flags.map((flag) => (
              <li key={flag}>{t(`ai.flags.${flag}`)}</li>
            ))}
          </ul>
          <p className="mt-2 font-medium">{t('ai.flags.blocksApprove')}</p>
        </Alert>
      )}

      {aiReview.writtenFeedback && (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-semibold text-ink">
            {t('ai.writtenFeedback', { locale: aiReview.locale })}
          </h3>
          <p className="rounded-control border border-border bg-surface p-3 text-sm break-words whitespace-pre-wrap text-ink">
            {aiReview.writtenFeedback}
          </p>
        </div>
      )}
      <TextList title={t('ai.strengths')} items={aiReview.strengths} />
      <TextList title={t('ai.improvements')} items={aiReview.improvements} />
      {rows.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-ink">{t('ai.criteria')}</h3>
          <CriteriaList rows={rows} showScores />
        </div>
      )}
      <TextList title={t('ai.limitations')} items={aiReview.limitations} />
    </div>
  );
}
