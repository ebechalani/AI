'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/ui';
import type { AiReview, Submission, TeacherReview } from '@/types/project';
import { focusInView, focusWasLost, useRefocusWhenLost } from './focus';
import type { ApproveBlock } from './review-model';
import { ReviewForm } from './ReviewForm';
import { ReviewOutcome } from './ReviewOutcome';

export interface ReviewPanelProps {
  submission: Submission;
  aiReview: AiReview | null;
  /** The newest teacher review, for the recorded decision. */
  latestReview: TeacherReview | null;
  approveBlock: ApproveBlock | null;
}

/**
 * The decision form while the work waits for a review, the recorded decision once it has one.
 * The panel stays mounted across the refresh that follows a decision (keyed by submission), so
 * it moves focus to the outcome's heading and keeps a conflict notice in view.
 */
export function ReviewPanel({
  submission,
  aiReview,
  latestReview,
  approveBlock,
}: ReviewPanelProps) {
  const t = useTranslations('review');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const [conflicts, setConflicts] = useState(0);
  useRefocusWhenLost(headingRef, submission.status);

  // The submit button was disabled while the action ran: the notice takes the lost focus.
  useEffect(() => {
    if (conflicts > 0 && focusWasLost(null)) focusInView(noticeRef.current);
  }, [conflicts]);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {conflicts > 0 && (
        <div ref={noticeRef} tabIndex={-1} className="rounded-control">
          <Alert tone="warning">{t('form.errors.conflict')}</Alert>
        </div>
      )}
      {submission.status === 'submitted' ? (
        <ReviewForm
          submission={submission}
          aiReview={aiReview}
          approveBlock={approveBlock}
          onConflict={() => setConflicts((count) => count + 1)}
        />
      ) : (
        <ReviewOutcome
          submission={submission}
          review={latestReview}
          headingLevel="h2"
          headingRef={headingRef}
        />
      )}
    </div>
  );
}
