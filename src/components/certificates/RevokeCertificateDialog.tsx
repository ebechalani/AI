'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { revokeCertificateAction } from '@/actions/certificates';
import { Alert, Button, Dialog, FormField, Textarea } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { CONTENT_LIMITS } from '@/lib/limits';
import { revokeCertificateInputSchema } from '@/lib/schemas/certificate';
import { parseInput } from '@/lib/schemas/common';
import type { ActionError } from '@/types/actions';
import { revokeProblem } from './certificate-model';
import { useActionErrorMessage, useValidationMessage } from './use-action-error';

export interface RevokeCertificateDialogProps {
  open: boolean;
  onClose: () => void;
  certificateId: string;
  /** After a success; the owner closes the dialog, toasts and refreshes. */
  onRevoked: () => void;
}

/** Asks for the reason (the holder sees it), then revokes through `revokeCertificateAction`. */
export function RevokeCertificateDialog({
  open,
  onClose,
  certificateId,
  onRevoked,
}: RevokeCertificateDialogProps) {
  const t = useTranslations('certificates');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const errorMessage = useActionErrorMessage();
  const validationMessage = useValidationMessage();
  const formId = useId();
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | undefined>(undefined);
  const [error, setError] = useState<ActionError | null>(null);
  const [pending, setPending] = useState(false);

  function message(failure: ActionError): string {
    switch (revokeProblem(failure)) {
      case 'invalid':
        return t('revoke.errors.invalid');
      case 'forbidden':
        return t('revoke.errors.forbidden');
      case 'notFound':
        return t('revoke.errors.notFound');
      case 'session':
        return tErrors('unauthenticated');
      default:
        return errorMessage(failure);
    }
  }

  function close() {
    if (pending) return;
    const problem = error === null ? null : revokeProblem(error);
    setReason('');
    setReasonError(undefined);
    setError(null);
    onClose();
    if (problem === 'notFound' || problem === 'session') router.refresh();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    const input = { certificateId, reason };
    // The same schema as the action: an empty or too long reason never leaves the browser.
    const parsed = parseInput(revokeCertificateInputSchema, input);
    if (!parsed.success) {
      const key = parsed.fieldErrors.reason?.[0];
      if (key !== undefined) {
        setReasonError(validationMessage(key));
        reasonRef.current?.focus();
      } else {
        setReasonError(undefined);
        setError({ code: 'validation', fieldErrors: parsed.fieldErrors });
      }
      return;
    }
    setReasonError(undefined);
    setPending(true);
    try {
      const result = await revokeCertificateAction(parsed.data);
      setPending(false);
      if (result.ok) {
        setReason('');
        onRevoked();
        return;
      }
      if (revokeProblem(result.error) === 'field') {
        setReasonError(validationMessage(result.error.fieldErrors?.reason?.[0]));
        reasonRef.current?.focus();
      } else {
        setError(result.error);
      }
    } catch {
      setPending(false);
      setError({ code: 'internal' });
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      size="md"
      dismissible={!pending}
      title={t('revoke.dialog.title')}
      description={t('revoke.dialog.description')}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={pending}>
            {tCommon('actions.cancel')}
          </Button>
          <Button type="submit" form={formId} variant="danger" loading={pending}>
            {t('revoke.dialog.confirm')}
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="flex flex-col gap-4">
        {error && <Alert tone="danger">{message(error)}</Alert>}
        <FormField
          label={t('revoke.dialog.reason')}
          hint={t('revoke.dialog.reasonHint', { max: CONTENT_LIMITS.revokeReasonChars })}
          required
          error={reasonError}
        >
          <Textarea
            ref={reasonRef}
            data-autofocus
            name="reason"
            rows={3}
            maxLength={CONTENT_LIMITS.revokeReasonChars}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            readOnly={pending}
          />
        </FormField>
      </form>
    </Dialog>
  );
}
