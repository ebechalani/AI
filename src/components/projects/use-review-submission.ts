import { useEffect, useEffectEvent, useState, useTransition, type RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { reviewSubmissionAction } from '@/actions/review';
import { useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { parseInput } from '@/lib/schemas/common';
import { reviewInputSchema } from '@/lib/schemas/submission';
import type { ActionError } from '@/types/actions';
import type { ReviewDecision, RubricKey } from '@/types/project';
import { focusInView, focusWasLost, hasKeyboardFocus } from './focus';
import {
  parseCriteriaDraft,
  reviewFieldOf,
  toReviewInput,
  type CriteriaDraft,
  type ReviewField,
} from './review-model';
import { useActionErrorMessage } from './use-action-error';

// Sending the teacher's decision (SPEC-D 10.3): the scores and the schema first, then
// reviewSubmissionAction, then a toast and a refresh that shows the recorded decision. The form
// stays busy until that refresh has arrived: a second click in between would send the decision
// again, and the server would refuse it as a conflict.

export type ReviewAlert = 'form' | 'not_found' | 'session';

type FocusTarget = 'alert' | 'submit' | ReviewField;

export interface ReviewDraft {
  decision: ReviewDecision;
  criteria: CriteriaDraft;
  feedback: string;
}

export interface UseReviewSubmissionArgs {
  submissionId: string;
  /** The AI suggestion the form shows (null: none), sent so an approve grades with it. */
  aiReviewId: string | null;
  studentName: string;
  /** The criteria in the order of their inputs. */
  criteriaOrder: readonly RubricKey[];
  formRef: RefObject<HTMLFormElement | null>;
  submitRef: RefObject<HTMLButtonElement | null>;
  alertRef: RefObject<HTMLDivElement | null>;
  focusField: (field: ReviewField) => void;
  /** Someone else decided first, or the suggestion changed: the panel shows it above the form. */
  onConflict: () => void;
}

export function useReviewSubmission({
  submissionId,
  aiReviewId,
  studentName,
  criteriaOrder,
  formRef,
  submitRef,
  alertRef,
  focusField,
  onConflict,
}: UseReviewSubmissionArgs) {
  const t = useTranslations('review');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const [sending, setSending] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const pending = sending || refreshing;
  const [errors, setErrors] = useState<Partial<Record<ReviewField, string>>>({});
  const [formAlert, setFormAlert] = useState<ReviewAlert | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ target: FocusTarget; seq: number } | null>(
    null,
  );

  const applyFocus = useEffectEvent((target: FocusTarget) => {
    const form = formRef.current;
    if (target === 'alert') {
      if (focusWasLost(form)) focusInView(alertRef.current);
    } else if (target === 'submit') {
      if (focusWasLost(form)) focusInView(submitRef.current);
    } else {
      focusField(target);
    }
  });

  useEffect(() => {
    if (focusRequest !== null) applyFocus(focusRequest.target);
  }, [focusRequest]);

  function requestFocus(target: FocusTarget) {
    setFocusRequest((current) => ({ target, seq: (current?.seq ?? 0) + 1 }));
  }

  const order: readonly ReviewField[] = ['decision', 'criteria', ...criteriaOrder, 'feedback'];

  /** Shows the errors inline (unknown paths as the form alert) and focuses the first one. */
  function show(next: Partial<Record<ReviewField, string>>, formLevel: boolean) {
    setErrors(next);
    const first = order.find((field) => next[field] !== undefined);
    if (formLevel || first === undefined) setFormAlert('form');
    requestFocus(first ?? 'alert');
  }

  function fromFieldErrors(raw: Record<string, string[]> | undefined) {
    const next: Partial<Record<ReviewField, string>> = {};
    let formLevel = false;
    for (const [path, keys] of Object.entries(raw ?? {})) {
      const field = reviewFieldOf(path);
      if (field === null) formLevel = true;
      else if (keys[0] !== undefined) next[field] ??= keys[0];
    }
    return { next, formLevel };
  }

  function clearError(field: ReviewField) {
    setErrors((current) => {
      if (current[field] === undefined) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function submit(draft: ReviewDraft): Promise<void> {
    if (pending) return;
    setFormAlert(null);
    const scores = draft.decision === 'modify' ? parseCriteriaDraft(draft.criteria) : null;
    const input = toReviewInput({
      submissionId,
      decision: draft.decision,
      criteria: scores?.ok === true ? scores.criteria : null,
      feedback: draft.feedback,
      aiReviewId,
    });
    const parsed = parseInput(reviewInputSchema, input);
    if (scores?.ok === false || !parsed.success) {
      const { next, formLevel } = parsed.success
        ? { next: {} as Partial<Record<ReviewField, string>>, formLevel: false }
        : fromFieldErrors(parsed.fieldErrors);
      if (scores?.ok === false) {
        // The scores' own messages say more than "required" on the whole group.
        delete next.criteria;
        Object.assign(next, scores.errors);
      }
      show(next, formLevel);
      return;
    }
    setErrors({});

    const fromKeyboard = hasKeyboardFocus(submitRef.current);
    setSending(true);
    let error: ActionError;
    try {
      const result = await reviewSubmissionAction(input);
      if (result.ok) {
        toast({ tone: 'success', title: t(`form.done.${draft.decision}`, { name: studentName }) });
        startRefresh(() => router.refresh());
        return;
      }
      error = result.error;
    } catch {
      error = { code: 'internal' };
    } finally {
      setSending(false);
    }

    switch (error.code) {
      case 'validation': {
        const { next, formLevel } = fromFieldErrors(error.fieldErrors);
        show(next, formLevel);
        return;
      }
      case 'conflict':
        // Reviewed meanwhile, or a newer suggestion than the one shown: the refresh brings the
        // new state, and a new suggestion seeds the form again (ReviewForm).
        onConflict();
        router.refresh();
        return;
      case 'not_found':
        setFormAlert('not_found');
        requestFocus('alert');
        router.refresh();
        return;
      case 'unauthenticated':
        // No refresh: the feedback typed so far must survive.
        setFormAlert('session');
        requestFocus('alert');
        return;
      default:
        toast({ tone: 'danger', title: errorMessage(error) });
        if (fromKeyboard) requestFocus('submit');
    }
  }

  return { pending, errors, formAlert, submit, clearError };
}
