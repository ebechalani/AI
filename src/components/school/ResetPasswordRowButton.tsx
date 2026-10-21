'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { resetStudentPasswordAction } from '@/actions/classes';
import type { StudentCredential } from '@/components/classes/class-model';
import { ConfirmDialog } from '@/components/classes/ConfirmDialog';
import { CredentialsDialog } from '@/components/classes/CredentialsDialog';
import { Button, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError } from '@/types/actions';
import { MAIN_CONTENT_ID } from './focus';
import { useActionErrorMessage } from './use-action-error';
import { useFocusAfterClose } from './use-focus-after-close';

export interface ResetPasswordRowButtonProps {
  studentUid: string;
  studentName: string;
  /** Printed on the slip; null on the students page ("RoboHolic AI account"). */
  className: string | null;
}

/**
 * A new password for a username pupil, after a confirmation, shown once. The password lives only
 * in this component's state; the page is refreshed when the credentials dialog closes, so a
 * refresh cannot unmount it while the password is on screen.
 */
export function ResetPasswordRowButton({
  studentUid,
  studentName,
  className,
}: ResetPasswordRowButtonProps) {
  const t = useTranslations('school');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<StudentCredential[] | null>(null);
  const [batch, setBatch] = useState(0);
  const focusLater = useFocusAfterClose(confirmOpen);

  function report(failure: ActionError) {
    switch (failure.code) {
      case 'forbidden':
        setError(t('resetPassword.errors.forbidden'));
        return;
      case 'not_found':
        // The refresh drops the row and this button: close first, then the message as a toast
        // and the focus on <main>.
        toast({ tone: 'warning', title: t('resetPassword.errors.notFound') });
        focusLater(MAIN_CONTENT_ID);
        setConfirmOpen(false);
        router.refresh();
        return;
      case 'unauthenticated':
        setError(tErrors('unauthenticated'));
        router.refresh();
        return;
      default:
        setError(errorMessage(failure));
    }
  }

  async function confirm() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await resetStudentPasswordAction({ studentUid });
      if (!result.ok) {
        report(result.error);
        return;
      }
      setConfirmOpen(false);
      setCredentials([
        { displayName: studentName, username: result.data.username, password: result.data.password },
      ]);
      setBatch((value) => value + 1);
    } catch {
      report({ code: 'internal' });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        aria-label={t('resetPassword.actionLabel', { name: studentName })}
        onClick={() => {
          setError(null);
          setConfirmOpen(true);
        }}
      >
        {t('resetPassword.action')}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('resetPassword.title', { name: studentName })}
        description={t('resetPassword.description', { name: studentName })}
        confirmLabel={t('resetPassword.confirm')}
        pending={pending}
        error={error}
        onConfirm={confirm}
      />
      <CredentialsDialog
        key={`credentials-${batch}`}
        open={credentials !== null}
        onClose={() => {
          setCredentials(null);
          router.refresh();
        }}
        title={t('resetPassword.credentialsTitle', { name: studentName })}
        className={className}
        credentials={credentials ?? []}
      />
    </>
  );
}
