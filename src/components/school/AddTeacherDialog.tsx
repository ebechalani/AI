'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { createTeacherAction } from '@/actions/school';
import { Alert, Button, Dialog, FormField, Input, Spinner, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { CONTENT_LIMITS } from '@/lib/limits';
import { parseInput } from '@/lib/schemas/common';
import { createTeacherInputSchema } from '@/lib/schemas/school';
import type { ActionError, ActionResult } from '@/types/actions';
import { DIALOG_TEXT } from './dialog';
import { showErrorsAndFocus } from './focus';
import { sendPasswordEmail } from './password-email';
import { useActionErrorMessage, useValidationMessage } from './use-action-error';

export interface AddTeacherDialogProps {
  open: boolean;
  onClose: () => void;
}

type Field = 'displayName' | 'email';
const FIELDS: readonly Field[] = ['displayName', 'email'];

/** form → sending (the account exists, the email is on its way) → emailFailed (only on failure). */
type Phase = 'form' | 'sending' | 'emailFailed';

/**
 * Name and email → `createTeacherAction` → the password email from the browser. The page is
 * refreshed when the dialog closes after an account was created, never while it is open (the
 * first teacher replaces the empty state, which must not unmount the dialog).
 */
export function AddTeacherDialog({ open, onClose }: AddTeacherDialogProps) {
  const t = useTranslations('school');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const validationMessage = useValidationMessage();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<Record<Field, string>>({ displayName: '', email: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('form');
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<{ name: string; email: string } | null>(null);
  const [reason, setReason] = useState('');

  function close() {
    onClose();
    if (created !== null) router.refresh();
  }

  function showFieldErrors(fieldErrors: Record<string, string[]>) {
    const next: Partial<Record<Field, string>> = {};
    let unknown = false;
    for (const [path, keys] of Object.entries(fieldErrors)) {
      if ((FIELDS as readonly string[]).includes(path)) {
        next[path as Field] = validationMessage(keys[0]);
      } else {
        unknown = true;
      }
    }
    showErrorsAndFocus(
      () => {
        setErrors(next);
        setFormError(unknown ? t('shared.form') : null);
      },
      formRef.current,
      () => alertRef.current,
    );
  }

  function report(error: ActionError) {
    switch (error.code) {
      case 'validation':
        // Without field errors the whole form is at fault: the form alert says so.
        showFieldErrors(error.fieldErrors ?? { _form: ['invalid'] });
        return;
      case 'conflict':
        showErrorsAndFocus(
          () => {
            setErrors({ email: t('teachers.add.errors.conflict') });
            setFormError(null);
          },
          formRef.current,
        );
        return;
      case 'not_found':
        showErrorsAndFocus(() => setFormError(t('shared.schoolGone')), null, () => alertRef.current);
        return;
      case 'unauthenticated':
        showErrorsAndFocus(
          () => setFormError(tErrors('unauthenticated')),
          null,
          () => alertRef.current,
        );
        router.refresh();
        return;
      default:
        showErrorsAndFocus(() => setFormError(errorMessage(error)), null, () => alertRef.current);
    }
  }

  /** The account exists: send the email; on success the dialog closes and the page refreshes. */
  async function sendEmail(account: { name: string; email: string }) {
    const failure = await sendPasswordEmail(account.email);
    if (failure === null) {
      toast({ tone: 'success', title: t('teachers.add.success', account) });
      onClose();
      router.refresh();
      return;
    }
    // The submit or retry button that held the focus is replaced: the warning takes it.
    showErrorsAndFocus(
      () => {
        setReason(errorMessage(failure));
        setPhase('emailFailed');
        setPending(false);
      },
      null,
      () => alertRef.current,
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || phase !== 'form') return;
    const parsed = parseInput(createTeacherInputSchema, values);
    if (!parsed.success) {
      showFieldErrors(parsed.fieldErrors);
      return;
    }
    setErrors({});
    setFormError(null);
    setPending(true);
    let result: ActionResult<{ uid: string; email: string }>;
    try {
      result = await createTeacherAction(parsed.data);
    } catch {
      result = { ok: false, error: { code: 'internal' } };
    }
    if (!result.ok) {
      setPending(false);
      report(result.error);
      return;
    }
    const account = { name: parsed.data.displayName, email: result.data.email };
    setCreated(account);
    setPhase('sending');
    await sendEmail(account);
  }

  async function retry() {
    if (pending || created === null) return;
    setPending(true);
    await sendEmail(created);
  }

  const sending = phase === 'sending';
  const footer =
    phase === 'emailFailed' ? (
      <>
        <Button variant="secondary" onClick={close} disabled={pending}>
          {t('teachers.add.close')}
        </Button>
        <Button loading={pending} onClick={retry}>
          {t('teachers.add.retry')}
        </Button>
      </>
    ) : (
      <>
        <Button variant="secondary" onClick={close} disabled={pending}>
          {tCommon('actions.cancel')}
        </Button>
        <Button type="submit" form={formId} loading={pending}>
          {t('teachers.add.submit')}
        </Button>
      </>
    );

  return (
    <Dialog
      open={open}
      onClose={close}
      title={t('teachers.add.title')}
      description={t('teachers.add.description')}
      size="md"
      className={DIALOG_TEXT}
      // An Escape mid-send would close the dialog with the account created and no word on the
      // email: closed only by its buttons until the email has been sent or has failed.
      dismissible={!pending && !sending}
      footer={footer}
    >
      {phase === 'emailFailed' && created !== null ? (
        <div ref={alertRef} tabIndex={-1} className="outline-none">
          <Alert tone="warning" title={t('teachers.add.emailFailed.title')}>
            {t('teachers.add.emailFailed.description', { name: created.name, reason })}
          </Alert>
        </div>
      ) : (
        <form
          id={formId}
          ref={formRef}
          noValidate
          onSubmit={onSubmit}
          className="flex flex-col gap-5"
        >
          <FormField
            label={t('teachers.add.name')}
            hint={t('teachers.add.nameHint')}
            error={errors.displayName}
            required
          >
            <Input
              name="displayName"
              value={values.displayName}
              onChange={(event) => setValues({ ...values, displayName: event.target.value })}
              autoComplete="off"
              maxLength={CONTENT_LIMITS.displayNameMaxChars}
              disabled={pending}
              data-autofocus
            />
          </FormField>
          <FormField
            label={t('teachers.add.email')}
            hint={t('teachers.add.emailHint')}
            error={errors.email}
            required
          >
            <Input
              type="email"
              name="email"
              value={values.email}
              onChange={(event) => setValues({ ...values, email: event.target.value })}
              autoComplete="off"
              maxLength={CONTENT_LIMITS.emailChars}
              disabled={pending}
            />
          </FormField>
          {sending && (
            <p className="flex items-center gap-3 text-sm font-medium text-ink">
              <Spinner size="sm" label={t('teachers.add.sending')} />
              <span aria-hidden="true">{t('teachers.add.sending')}</span>
            </p>
          )}
          {formError !== null && (
            <div ref={alertRef} tabIndex={-1} className="outline-none">
              <Alert tone="danger">{formError}</Alert>
            </div>
          )}
        </form>
      )}
    </Dialog>
  );
}
