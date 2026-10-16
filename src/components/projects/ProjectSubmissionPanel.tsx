'use client';

import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LinkButton } from '@/components/ui';
import { SUBMISSION_LIMITS } from '@/lib/limits';
import type { SubmissionType } from '@/types/common';
import type { Submission } from '@/types/project';
import { CheckAgainButton } from './CheckAgainButton';
import { useRefocusWhenLost } from './focus';
import { OutcomeNotice } from './OutcomeNotice';
import { blockState, studentOutcome } from './projects-model';
import { SubmissionEditor } from './SubmissionEditor';
import { seedFrom } from './submission-form-model';
import { SubmissionStatusLine } from './SubmissionStatusLine';

export interface ProjectSubmissionPanelProps {
  courseId: string;
  projectId: string;
  allowedTypes: SubmissionType[];
  /** The student's latest attempt at this project, or null. */
  latest: Submission | null;
  readOnly: boolean;
}

/**
 * The lesson block's lower half (SPEC-D 6): the form, or where the latest attempt stands. No
 * "Ask Robo AI again" here: it runs the review inline, which belongs to the attempt's page.
 */
export function ProjectSubmissionPanel({
  courseId,
  projectId,
  allowedTypes,
  latest,
  readOnly,
}: ProjectSubmissionPanelProps) {
  const t = useTranslations('projects');
  const headingRef = useRef<HTMLHeadingElement>(null);
  // After a send the editor is gone, after Check again its button may be: "Your submission"
  // takes the lost focus when what it shows has changed.
  useRefocusWhenLost(headingRef, `${latest?.id}/${latest?.status}/${latest?.aiReviewStatus}`);
  const state = blockState(latest, readOnly);
  const target = { context: 'project', courseId, projectId } as const;
  const subheading = 'text-base font-semibold text-ink';

  if (state === 'preview') {
    return <p className="text-sm text-ink-muted">{t('block.preview')}</p>;
  }
  if (state === 'submit' || latest === null) {
    return (
      <section className="flex flex-col gap-4 border-t border-border pt-5">
        <h4 className={subheading}>{t('block.submitTitle')}</h4>
        <SubmissionEditor target={target} allowedTypes={allowedTypes} seed={null} />
      </section>
    );
  }

  const outcome = studentOutcome(latest);
  const showFeedback =
    latest.finalFeedback !== null &&
    (outcome.kind === 'approved' || outcome.kind === 'returned_teacher');

  return (
    <>
      <section className="flex flex-col gap-4 border-t border-border pt-5">
        <h4 ref={headingRef} tabIndex={-1} className={`${subheading} outline-none`}>
          {t('block.yourSubmission')}
        </h4>
        <SubmissionStatusLine submission={latest} showScore />
        <OutcomeNotice outcome={outcome} headingLevel="h4" retryHint={false}>
          {outcome.kind === 'ai_pending' && (
            <CheckAgainButton
              label={t('outcome.checkAgain')}
              stillPendingLabel={t('outcome.aiPending.still')}
            />
          )}
        </OutcomeNotice>
        {showFeedback && (
          <div className="rounded-control border border-border bg-surface-muted p-4">
            <p className="text-sm font-semibold text-ink">{t('feedback.teacher.title')}</p>
            <p className="mt-1 text-sm break-words whitespace-pre-wrap text-ink">
              {latest.finalFeedback}
            </p>
          </div>
        )}
        <div>
          <LinkButton href={`/student/projects/${latest.id}`} variant="secondary">
            {t('block.viewSubmission')}
            <ArrowRight aria-hidden="true" className="rtl:rotate-180" />
          </LinkButton>
        </div>
      </section>
      {state === 'resubmit' && (
        <section className="flex flex-col gap-4 border-t border-border pt-5">
          <h4 className={subheading}>{t('block.resubmitTitle')}</h4>
          <SubmissionEditor
            key={latest.id}
            target={target}
            allowedTypes={allowedTypes}
            previousSubmissionId={latest.id}
            seed={seedFrom(latest)}
          />
        </section>
      )}
      {state === 'no_attempts' && (
        <p className="text-sm text-ink-muted">
          {t('block.noAttemptsLeft', { max: SUBMISSION_LIMITS.maxAttempts })}
        </p>
      )}
    </>
  );
}
