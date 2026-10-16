import { useTranslations } from 'next-intl';
import { useDateFormat } from '@/components/domain';
import { Card, Chip } from '@/components/ui';
import type { TeacherReview } from '@/types';

/** Every decision recorded on this attempt, newest first (reviews are append-only). */
export function ReviewHistory({ reviews }: { reviews: TeacherReview[] }) {
  const t = useTranslations('review');
  const tDomain = useTranslations('domain');
  const formatDate = useDateFormat();
  if (reviews.length === 0) return null;

  return (
    <Card as="section" aria-labelledby="review-history" className="gap-4 p-5 sm:p-6">
      <h2 id="review-history" className="text-lg font-semibold text-ink">
        {t('detail.history.title')}
      </h2>
      <ol className="flex flex-col divide-y divide-border">
        {reviews.map((review) => (
          <li key={review.id} className="flex min-w-0 flex-col gap-2 py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <Chip tone={review.decision === 'return' ? 'warning' : 'success'}>
                {t(`decisions.${review.decision}`)}
              </Chip>
              {review.score !== null && (
                <span className="text-sm font-semibold text-ink tabular-nums">
                  {tDomain('project.score', { score: review.score })}
                </span>
              )}
            </div>
            <p className="text-sm text-ink-muted">
              {t('detail.history.by', {
                name: review.reviewerName,
                date: formatDate(review.createdAt, 'dateTime'),
              })}
            </p>
            <p className="text-sm break-words whitespace-pre-wrap text-ink">{review.feedback}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
