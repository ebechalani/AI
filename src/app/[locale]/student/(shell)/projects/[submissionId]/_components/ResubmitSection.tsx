import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ResubmitState } from '@/components/projects/projects-model';
import { SubmissionEditor } from '@/components/projects/SubmissionEditor';
import type { SubmissionSeed } from '@/components/projects/submission-form-model';
import { Alert, LinkButton } from '@/components/ui';
import { SUBMISSION_LIMITS } from '@/lib/limits';
import type { SubmissionTarget, SubmissionType } from '@/types';

export interface ResubmitSectionProps {
  /** Not `not_returned`: the section is only for returned work. */
  state: Exclude<ResubmitState, 'not_returned'>;
  submissionId: string;
  /** The target and types of the work; null when the definition is gone. */
  target: SubmissionTarget | null;
  allowedTypes: SubmissionType[];
  seed: SubmissionSeed;
  latestId: string | null;
}

/** A new version of returned work, or why none can be sent from here (SPEC-D 8.2). */
export function ResubmitSection({
  state,
  submissionId,
  target,
  allowedTypes,
  seed,
  latestId,
}: ResubmitSectionProps) {
  const t = useTranslations('projects');

  let body;
  if (state === 'not_latest' && latestId !== null) {
    body = (
      <Alert
        tone="info"
        live="off"
        title={t('detail.newerAttempt.title')}
        action={
          <LinkButton href={`/student/projects/${latestId}`} variant="secondary" size="sm">
            {t('detail.newerAttempt.action')}
            <ArrowRight aria-hidden="true" className="rtl:rotate-180" />
          </LinkButton>
        }
      >
        {t('detail.newerAttempt.description')}
      </Alert>
    );
  } else if (state === 'allowed' && target !== null && allowedTypes.length > 0) {
    body = (
      <>
        <p className="text-base text-ink-muted">{t('detail.resubmit.description')}</p>
        <SubmissionEditor
          target={target}
          allowedTypes={allowedTypes}
          previousSubmissionId={submissionId}
          seed={seed}
        />
      </>
    );
  } else if (state === 'no_attempts') {
    body = (
      <p className="text-base text-ink-muted">
        {t('detail.resubmit.noAttemptsLeft', { max: SUBMISSION_LIMITS.maxAttempts })}
      </p>
    );
  } else if (state === 'closed') {
    body = <p className="text-base text-ink-muted">{t('detail.resubmit.closed')}</p>;
  } else {
    body = <p className="text-base text-ink-muted">{t('detail.resubmit.unavailable')}</p>;
  }

  return (
    <section aria-labelledby="resubmit-title" className="flex min-w-0 flex-col gap-4">
      <h2 id="resubmit-title" className="text-xl font-bold text-ink">
        {t('detail.resubmit.title')}
      </h2>
      {body}
    </section>
  );
}
