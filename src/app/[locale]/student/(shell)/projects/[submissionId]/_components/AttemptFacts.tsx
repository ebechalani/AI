import type { ReactNode } from 'react';
import { History } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDateFormat } from '@/components/domain';
import { Card, LinkButton } from '@/components/ui';
import { SUBMISSION_LIMITS } from '@/lib/limits';
import type { Submission } from '@/types';

function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5">
      <dt className="text-sm text-ink-muted">{term}</dt>
      <dd className="text-sm font-medium break-words text-ink">{children}</dd>
    </div>
  );
}

/** The attempt at a glance: its number, when it was sent and reviewed, its type and XP. */
export function AttemptFacts({ submission }: { submission: Submission }) {
  const t = useTranslations('projects');
  const tDomain = useTranslations('domain');
  const formatDate = useDateFormat();
  const { attemptNumber, previousSubmissionId, reviewedAt, xpAwarded } = submission;

  return (
    <Card as="section" aria-labelledby="attempt-facts" className="gap-3 p-5 sm:p-6">
      <h2 id="attempt-facts" className="text-lg font-semibold text-ink">
        {t('detail.facts.title')}
      </h2>
      <dl className="flex flex-col divide-y divide-border">
        <Fact term={t('detail.facts.attempt')}>
          {t('detail.facts.attemptValue', {
            number: attemptNumber,
            max: SUBMISSION_LIMITS.maxAttempts,
          })}
        </Fact>
        <Fact term={t('detail.facts.submitted')}>
          {formatDate(submission.submittedAt, 'dateTime')}
        </Fact>
        {reviewedAt !== null && (
          <Fact term={t('detail.facts.reviewed')}>{formatDate(reviewedAt, 'dateTime')}</Fact>
        )}
        <Fact term={t('detail.facts.type')}>{tDomain(`submissionTypes.${submission.type}`)}</Fact>
        {xpAwarded > 0 && (
          <Fact term={t('detail.facts.xp')}>{tDomain('xp.amount', { xp: xpAwarded })}</Fact>
        )}
      </dl>
      {previousSubmissionId !== null && (
        <div>
          <LinkButton
            href={`/student/projects/${previousSubmissionId}`}
            variant="ghost"
            size="sm"
            className="-ms-3"
          >
            <History aria-hidden="true" />
            {t('detail.previousAttempt', { number: attemptNumber - 1 })}
          </LinkButton>
        </div>
      )}
    </Card>
  );
}
