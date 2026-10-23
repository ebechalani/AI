'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { revokeCertificateAction } from '@/actions/certificates';
import { Alert, Button, Dialog, FormField, Textarea, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import { CONTENT_LIMITS } from '@/lib/limits';
import { revokeCertificateInputSchema } from '@/lib/schemas/certificate';
import { parseInput } from '@/lib/schemas/common';
import type { ActionError, ActionResult } from '@/types/actions';
import { DIALOG_TEXT } from './dialog';
import { showErrorsAndFocus } from './focus';
import { useActionErrorMessage, useValidationMessage } from './use-action-error';
import { useFocusAfterClose } from './use-focus-after-close';

export interface RevokeCertificateButtonProps {
  certificateId: string;
  learnerName: string;
  courseTitle: string;
  /** Where the focus goes once the refresh has removed this button. */
  focusAfterId: string;
}

/** "Revoke": opens the reason dialog, fresh on every opening. */
export function RevokeCertificateButton(props: RevokeCertificateButtonProps) {
  const t = useTranslations('admin');
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(0);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        aria-label={t('certificates.revoke.actionLabel', {
          name: props.learnerName,
          course: props.courseTitle,
        })}
        onClick={() => {
          setOpening((count) => count + 1);
          setOpen(true);
        }}
      >
        {t('certificates.revoke.action')}
      </Button>
      <RevokeCertificateDialog key={opening} open={open} onClose={() => setOpen(false)} {...props} />
    </>
  );
}

interface RevokeCertificateDialogProps extends RevokeCertificateButtonProps {
  open: boolean;
  onClose: () => void;
}

/** Revoke a certificate with a reason the learner sees (WS-J's `revokeCertificateAction`). */
function RevokeCertificateDialog({
  open,
  onClose,
  certificateId,
  learnerName,
  courseTitle,
  focusAfterId,
}: RevokeCertificateDialogProps) {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const validationMessage = useValidationMessage();
  const focusLater = useFocusAfterClose(open);
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [gone, setGone] = useState(false);

  function close() {
    onClose();
    if (gone) router.refresh();
  }

  function showFieldErrors(fieldErrors: Record<string, string[]>) {
    const paths = Object.keys(fieldErrors);
    const onlyReason = paths.length > 0 && paths.every((path) => path === 'reason');
    showErrorsAndFocus(
      () => {
        setReasonError(onlyReason ? validationMessage(fieldErrors.reason?.[0]) : undefined);
        setFormError(onlyReason ? null : t('shared.form'));
      },
      formRef.current,
      () => alertRef.current,
    );
  }

  function report(error: ActionError) {
    const show = (message: string) =>
      showErrorsAndFocus(() => setFormError(message), null, () => alertRef.current);
    switch (error.code) {
      case 'validation':
        showFieldErrors(error.fieldErrors ?? { _form: ['invalid'] });
        return;
      case 'not_found':
        setGone(true);
        show(t('certificates.revoke.errors.notFound'));
        return;
      case 'unauthenticated':
        show(tErrors('unauthenticated'));
        router.refresh();
        return;
      default:
        show(errorMessage(error));
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const parsed = parseInput(revokeCertificateInputSchema, { certificateId, reason });
    if (!parsed.success) {
      showFieldErrors(parsed.fieldErrors);
      return;
    }
    setReasonError(undefined);
    setFormError(null);
    setPending(true);
    let result: ActionResult<null>;
    try {
      result = await revokeCertificateAction(parsed.data);
    } catch {
      result = { ok: false, error: { code: 'internal' } };
    }
    setPending(false);
    if (!result.ok) {
      report(result.error);
      return;
    }
    focusLater(focusAfterId);
    onClose();
    toast({ tone: 'success', title: t('certificates.revoke.success') });
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={t('certificates.revoke.title')}
      description={t('certificates.revoke.description', { name: learnerName, course: courseTitle })}
      size="md"
      className={DIALOG_TEXT}
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            {tCommon('actions.cancel')}
          </Button>
          <Button type="submit" form={formId} variant="danger" loading={pending}>
            {t('certificates.revoke.confirm')}
          </Button>
        </>
      }
    >
      <form id={formId} ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <FormField
          label={t('certificates.revoke.reason')}
          hint={t('certificates.revoke.reasonHint', { max: CONTENT_LIMITS.revokeReasonChars })}
          error={reasonError}
          required
        >
          <Textarea
            name="reason"
            rows={3}
            maxLength={CONTENT_LIMITS.revokeReasonChars}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={pending}
            data-autofocus
          />
        </FormField>
        {formError !== null && (
          <div ref={alertRef} tabIndex={-1} className="outline-none">
            <Alert tone="danger">{formError}</Alert>
          </div>
        )}
      </form>
    </Dialog>
  );
}
