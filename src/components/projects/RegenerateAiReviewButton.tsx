'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { regenerateAiReviewAction } from '@/actions/review';
import { Button, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError } from '@/types/actions';
import { focusInView, focusWasLost } from './focus';
import { useActionErrorMessage } from './use-action-error';

export interface RegenerateAiReviewButtonProps {
  submissionId: string;
  /** The student asks Robo AI again; the teacher asks for a new suggestion. */
  audience: 'student' | 'teacher';
}

// The page has changed under the button: read it again.
const REFRESH_ON: ReadonlySet<ActionError['code']> = new Set([
  'conflict',
  'forbidden',
  'not_found',
  'unauthenticated',
]);

/**
 * One more AI review, run before the action answers (it can take a while on a real provider).
 * After the refresh the section's RefocusHeading takes focus; a failure returns it here. The
 * button stays busy until the refreshed page has arrived: a click in between would ask for one
 * more review, and use up one more of the submission's new suggestions.
 */
export function RegenerateAiReviewButton({
  submissionId,
  audience,
}: RegenerateAiReviewButtonProps) {
  const tProjects = useTranslations('projects');
  const tReview = useTranslations('review');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const [pending, setPending] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const busy = pending || refreshing;
  const [refocus, setRefocus] = useState(0);
  const handledRefocus = useRef(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // After a failure, once the button is enabled again (a disabled button cannot take focus).
  useEffect(() => {
    if (busy || refocus === handledRefocus.current) return;
    handledRefocus.current = refocus;
    if (focusWasLost(null)) focusInView(buttonRef.current);
  }, [refocus, busy]);

  const student = audience === 'student';

  async function regenerate() {
    if (busy) return;
    setPending(true);
    let error: ActionError;
    try {
      const result = await regenerateAiReviewAction({ submissionId });
      if (result.ok) {
        toast({
          tone: 'success',
          title: student ? tProjects('ai.retried') : tReview('ai.regenerated'),
        });
        startRefresh(() => router.refresh());
        return;
      }
      error = result.error;
    } catch {
      error = { code: 'internal' };
    } finally {
      setPending(false);
    }
    if (error.code === 'conflict') {
      toast({
        tone: 'warning',
        title: student ? tProjects('ai.retryConflict') : tReview('ai.regenerateConflict'),
      });
    } else {
      toast({ tone: 'danger', title: errorMessage(error) });
    }
    setRefocus((count) => count + 1);
    if (REFRESH_ON.has(error.code)) router.refresh();
  }

  return (
    <Button ref={buttonRef} variant="secondary" size="sm" loading={busy} onClick={regenerate}>
      {!busy && <Sparkles aria-hidden="true" />}
      {student ? tProjects('outcome.aiUnavailable.retry') : tReview('ai.regenerate')}
    </Button>
  );
}
