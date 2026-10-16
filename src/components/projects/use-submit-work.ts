import { useEffect, useEffectEvent, useState, useTransition, type RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { submitWorkAction } from '@/actions/projects';
import { useToast } from '@/components/ui';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { parseInput } from '@/lib/schemas/common';
import { submitWorkInputSchema } from '@/lib/schemas/submission';
import type { ActionError } from '@/types/actions';
import type { SubmissionTarget } from '@/types/project';
import { focusInView, focusWasLost, hasKeyboardFocus } from './focus';
import {
  FIELD_ORDER,
  splitFieldErrors,
  successTarget,
  toSubmitInput,
  type FormField,
  type SubmissionDraft,
} from './submission-form-model';
import { useActionErrorMessage } from './use-action-error';

// Sending the form (SPEC-D 5.3): the schema first (no action call for an invalid draft), then
// submitWorkAction, then the success toast and a refresh, or a push to the new attempt's page.
// The form stays busy until that page has arrived: a second click in between would send the
// work again, and the server would refuse it as a conflict.

export type FormAlert = 'form' | 'conflict' | 'not_found' | 'session';

type FocusRequest = { target: 'alert' | 'submit' | FormField; seq: number };

// After these the page has changed under the form (sent already, no attempt left, not enrolled):
// it is read again. Never after `unauthenticated`: the draft must survive.
const REFRESH_ON: ReadonlySet<ActionError['code']> = new Set(['conflict', 'not_found']);

export interface UseSubmitWorkArgs {
  target: SubmissionTarget;
  previousSubmissionId: string | null;
  onSubmitted?: (submissionId: string) => void;
  formRef: RefObject<HTMLFormElement | null>;
  submitRef: RefObject<HTMLButtonElement | null>;
  alertRef: RefObject<HTMLDivElement | null>;
  /** Moves focus to a field (its control, or the first control of a group). */
  focusField: (field: FormField) => void;
}

export function useSubmitWork({
  target,
  previousSubmissionId,
  onSubmitted,
  formRef,
  submitRef,
  alertRef,
  focusField,
}: UseSubmitWorkArgs) {
  const t = useTranslations('projects');
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const [sending, setSending] = useState(false);
  const [navigating, startNavigation] = useTransition();
  const pending = sending || navigating;
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormField, string>>>({});
  const [formAlert, setFormAlert] = useState<FormAlert | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);

  const applyFocus = useEffectEvent((request: FocusRequest) => {
    const form = formRef.current;
    if (request.target === 'alert') {
      if (focusWasLost(form)) focusInView(alertRef.current);
    } else if (request.target === 'submit') {
      if (focusWasLost(form)) focusInView(submitRef.current);
    } else {
      focusField(request.target);
    }
  });

  // Runs after the render that shows the errors and enables the submit button again.
  useEffect(() => {
    if (focusRequest !== null) applyFocus(focusRequest);
  }, [focusRequest]);

  function requestFocus(target: FocusRequest['target']) {
    setFocusRequest((current) => ({ target, seq: (current?.seq ?? 0) + 1 }));
  }

  /** Shows field errors inline (unknown paths as the form alert) and focuses the first one. */
  function showFieldErrors(raw: Record<string, string[]> | undefined): void {
    const { fields, form } = splitFieldErrors(raw);
    setFieldErrors(fields);
    const firstField = FIELD_ORDER.find((field) => fields[field] !== undefined);
    if (form.length > 0 || firstField === undefined) setFormAlert('form');
    requestFocus(firstField ?? 'alert');
  }

  function clearFieldError(field: FormField) {
    setFieldErrors((current) => {
      if (current[field] === undefined) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function submit(draft: SubmissionDraft): Promise<void> {
    if (pending) return;
    const input = toSubmitInput(draft, target, previousSubmissionId);
    setFormAlert(null);
    const parsed = parseInput(submitWorkInputSchema, input);
    if (!parsed.success) {
      showFieldErrors(parsed.fieldErrors);
      return;
    }
    setFieldErrors({});

    // Read before the button is disabled: then :focus-visible cannot be read any more.
    const fromKeyboard = hasKeyboardFocus(submitRef.current);
    setSending(true);
    let error: ActionError;
    try {
      const result = await submitWorkAction(input);
      if (result.ok) {
        toast({
          tone: 'success',
          title: t('form.submitted'),
          description: t('form.submittedDescription'),
        });
        onSubmitted?.(result.data.submissionId);
        const next = successTarget(pathname, previousSubmissionId, result.data.submissionId);
        startNavigation(() => {
          if (next.kind === 'push') router.push(next.href);
          else router.refresh();
        });
        return;
      }
      error = result.error;
    } catch {
      error = { code: 'internal' };
    } finally {
      setSending(false);
    }

    switch (error.code) {
      case 'validation':
        showFieldErrors(error.fieldErrors);
        return;
      case 'conflict':
      case 'not_found':
        setFormAlert(error.code);
        requestFocus('alert');
        break;
      case 'unauthenticated':
        setFormAlert('session');
        requestFocus('alert');
        return;
      default:
        toast({ tone: 'danger', title: errorMessage(error) });
        if (fromKeyboard) requestFocus('submit');
    }
    if (REFRESH_ON.has(error.code)) router.refresh();
  }

  return { pending, fieldErrors, formAlert, submit, clearFieldError };
}
