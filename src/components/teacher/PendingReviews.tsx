import { CircleCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ProjectCard } from '@/components/domain';
import { EmptyState, LinkButton } from '@/components/ui';
import type { Submission } from '@/types/project';
import { submissionPath, TEACHER_PATHS } from './paths';

export interface PendingReviewsProps {
  /** The oldest waiting submissions (the queue's first page). */
  submissions: Submission[];
  /** Everything waiting. */
  count: number;
}

export function PendingReviews({ submissions, count }: PendingReviewsProps) {
  const t = useTranslations('teacher');
  return (
    <section aria-labelledby="dashboard-pending-title" className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 id="dashboard-pending-title" className="text-xl font-bold text-ink">
          {t('dashboard.pending.title')}
        </h2>
        <p className="text-sm text-ink-muted">{t('dashboard.pending.count', { count })}</p>
      </div>
      {count === 0 || submissions.length === 0 ? (
        <EmptyState
          variant="plain"
          icon={<CircleCheck />}
          title={t('dashboard.pending.empty.title')}
          description={t('dashboard.pending.empty.description')}
          className="py-6"
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {submissions.map((submission) => (
              <ProjectCard
                key={submission.id}
                submission={submission}
                href={submissionPath(submission.id)}
                showStudent
              />
            ))}
          </div>
          <div>
            <LinkButton href={TEACHER_PATHS.projects} variant="secondary">
              {t('dashboard.pending.openQueue')}
            </LinkButton>
          </div>
        </>
      )}
    </section>
  );
}
