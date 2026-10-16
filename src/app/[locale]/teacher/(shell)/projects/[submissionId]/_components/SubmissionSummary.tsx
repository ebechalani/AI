import type { ReactNode } from 'react';
import { History } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StatusChip, useDateFormat } from '@/components/domain';
import { Card, LinkButton } from '@/components/ui';
import { SUBMISSION_LIMITS } from '@/lib/limits';
import type { Submission } from '@/types';

function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-sm text-ink-muted">{term}</dt>
      <dd className="text-sm font-medium break-words text-ink sm:text-end">{children}</dd>
    </div>
  );
}

/** Who sent the work, where it stands, which attempt, when, of which type, in which language. */
export function SubmissionSummary({ submission }: { submission: Submission }) {
  const t = useTranslations('review');
  const tDomain = useTranslations('domain');
  const tCommon = useTranslations('common');
  const formatDate = useDateFormat();
  const { attemptNumber, previousSubmissionId } = submission;
  const language = tCommon.has(`locale.names.${submission.locale}`)
    ? tCommon(`locale.names.${submission.locale}`)
    : submission.locale;

  return (
    <Card as="section" aria-labelledby="submission-summary" className="gap-3 p-5 sm:p-6">
      <h2 id="submission-summary" className="text-lg font-semibold text-ink">
        {t('detail.summary.title')}
      </h2>
      <dl className="grid divide-y divide-border sm:grid-cols-2 sm:gap-x-8 sm:divide-y-0">
        <Fact term={t('detail.summary.student')}>{submission.studentName}</Fact>
        <Fact term={t('detail.summary.status')}>
          <StatusChip status={submission.status} />
        </Fact>
        <Fact term={t('detail.summary.attempt')}>
          {t('detail.summary.attemptValue', {
            number: attemptNumber,
            max: SUBMISSION_LIMITS.maxAttempts,
          })}
        </Fact>
        <Fact term={t('detail.summary.submitted')}>
          {formatDate(submission.submittedAt, 'dateTime')}
        </Fact>
        <Fact term={t('detail.summary.type')}>{tDomain(`submissionTypes.${submission.type}`)}</Fact>
        <Fact term={t('detail.summary.language')}>{language}</Fact>
      </dl>
      {previousSubmissionId !== null && (
        <div>
          <LinkButton
            href={`/teacher/projects/${previousSubmissionId}`}
            variant="ghost"
            size="sm"
            className="-ms-3"
          >
            <History aria-hidden="true" />
            {t('detail.summary.previous', { number: attemptNumber - 1 })}
          </LinkButton>
        </div>
      )}
    </Card>
  );
}
