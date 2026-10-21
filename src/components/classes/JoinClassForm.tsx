'use client';

import { useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { joinClassAction } from '@/actions/classes';
import { Alert, Button, FormField, Input, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { joinClassInputSchema } from '@/lib/schemas/class';
import { parseInput } from '@/lib/schemas/common';
import type { ActionError } from '@/types/actions';
import { showErrorsAndFocus } from './focus';
import { useActionErrorMessage, useValidationMessage } from './use-action-error';

export interface JoinClassFormProps {
  /** Locale-less path to load after a successful join; defaults to the student home. */
  redirectTo?: string;
}

const noopSubscribe = () => () => {};
const urlCodeSnapshot = () => new URLSearchParams(window.location.search).get('code');
const serverCodeSnapshot = () => null;

/**
 * A signed-in student joins a class with its code (ARCHITECTURE.md 7.7). Only the field, the
 * button and their messages: the page around it brings the heading. A share link's `?code=`
 * fills the field right after hydration.
 */
export function JoinClassForm({ redirectTo }: JoinClassFormProps) {
  const t = useTranslations('classes');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const validationMessage = useValidationMessage();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // The server and the hydration render read null; React then re-renders with the URL's code.
  const urlCode = useSyncExternalStore(noopSubscribe, urlCodeSnapshot, serverCodeSnapshot);
  const [typed, setTyped] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const joinCode = typed ?? urlCode ?? '';

  /**
   * Renders the message first, then focuses the input: a field error is then already bound to
   * it (`aria-invalid`, `aria-describedby`) when the screen reader reads it (5.1, 7.3). A
   * form-level `Alert` is announced by its live region.
   */
  function showFieldError(message: string | undefined) {
    showErrorsAndFocus(() => setFieldError(message), formRef.current, () => inputRef.current);
  }

  function showFormError(message: string) {
    showErrorsAndFocus(() => setFormError(message), null, () => inputRef.current);
  }

  function report(error: ActionError) {
    switch (error.code) {
      case 'validation':
        showFieldError(validationMessage(error.fieldErrors?.joinCode?.[0] ?? 'invalid'));
        return;
      case 'not_found':
        showFieldError(t('join.errors.notFound'));
        return;
      case 'conflict':
        showFormError(t('join.errors.conflict'));
        return;
      case 'forbidden':
        showFormError(t('join.errors.forbidden'));
        return;
      case 'unauthenticated':
        showFormError(tErrors('unauthenticated'));
        router.refresh();
        return;
      default:
        showFormError(errorMessage(error));
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFieldError(undefined);
    setFormError(null);
    const parsed = parseInput(joinClassInputSchema, { joinCode });
    if (!parsed.success) {
      showFieldError(validationMessage(parsed.fieldErrors.joinCode?.[0] ?? 'invalid'));
      return;
    }
    setPending(true);
    try {
      // The raw value: the schema on the server normalises it too.
      const result = await joinClassAction({ joinCode });
      if (!result.ok) {
        setPending(false);
        report(result.error);
        return;
      }
      toast({ tone: 'success', title: t('join.success', { className: result.data.className }) });
      setTyped('');
      setPending(false);
      router.push(redirectTo ?? '/student');
      router.refresh();
    } catch {
      setPending(false);
      report({ code: 'internal' });
    }
  }

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormField label={t('join.code')} hint={t('join.codeHint')} error={fieldError}>
        <Input
          ref={inputRef}
          name="joinCode"
          value={joinCode}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={20}
          className="font-mono tracking-widest uppercase"
        />
      </FormField>
      {formError !== null && <Alert tone="danger" live="polite">{formError}</Alert>}
      <Button type="submit" size="lg" fullWidth loading={pending}>
        {t('join.submit')}
      </Button>
    </form>
  );
}
