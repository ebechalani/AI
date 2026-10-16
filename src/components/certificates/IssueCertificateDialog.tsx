'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { issueCertificateAction } from '@/actions/certificates';
import { Alert, Button, Dialog } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError } from '@/types/actions';
import { issueProblem } from './certificate-model';
import { useActionErrorMessage } from './use-action-error';

export interface IssueCertificateDialogProps {
  open: boolean;
  onClose: () => void;
  studentUid: string;
  courseId: string;
  /** `issue`: a first certificate; `reissue`: a revoked one becomes valid again with a new code. */
  mode: 'issue' | 'reissue';
  /** After a success; the owner closes the dialog, toasts and refreshes. */
  onIssued: (certificateId: string) => void;
}

/** Confirms, then issues through `issueCertificateAction`; the service decides (9.5). */
export function IssueCertificateDialog({
  open,
  onClose,
  studentUid,
  courseId,
  mode,
  onIssued,
}: IssueCertificateDialogProps) {
  const t = useTranslations('certificates');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const errorMessage = useActionErrorMessage();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ActionError | null>(null);

  function message(failure: ActionError): string {
    switch (issueProblem(failure)) {
      case 'invalid':
        return t('issue.errors.invalid');
      case 'conflict':
        return t('issue.errors.conflict');
      case 'forbidden':
        return t('issue.errors.forbidden');
      case 'notFound':
        return t('issue.errors.notFound');
      case 'session':
        return tErrors('unauthenticated');
      default:
        return errorMessage(failure);
    }
  }

  function close() {
    if (pending) return;
    const problem = error === null ? null : issueProblem(error);
    setError(null);
    onClose();
    // The page behind is out of date (the learner left, the session ended): read it again.
    if (problem === 'notFound' || problem === 'session') router.refresh();
  }

  async function confirm() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await issueCertificateAction({ studentUid, courseId });
      setPending(false);
      if (result.ok) onIssued(result.data.certificateId);
      else setError(result.error);
    } catch {
      setPending(false);
      setError({ code: 'internal' });
    }
  }

  const issue = mode === 'issue';
  return (
    <Dialog
      open={open}
      onClose={close}
      size="sm"
      dismissible={!pending}
      title={t(issue ? 'issue.dialog.title' : 'issue.dialog.reissueTitle')}
      description={t(issue ? 'issue.dialog.description' : 'issue.dialog.reissueDescription')}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={pending}>
            {tCommon('actions.cancel')}
          </Button>
          <Button data-autofocus loading={pending} onClick={confirm}>
            {t(issue ? 'issue.dialog.confirm' : 'issue.dialog.reissueConfirm')}
          </Button>
        </>
      }
    >
      {/* The dialog covers the toast region, so a failure is said here. */}
      {error && <Alert tone="danger">{message(error)}</Alert>}
    </Dialog>
  );
}
