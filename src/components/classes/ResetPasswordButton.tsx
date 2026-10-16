'use client';

import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { resetStudentPasswordAction } from '@/actions/classes';
import { Button, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError } from '@/types/actions';
import type { StudentCredential } from './class-model';
import { ConfirmDialog } from './ConfirmDialog';
import { CredentialsDialog } from './CredentialsDialog';
import { MAIN_CONTENT_ID } from './focus';
import { useActionErrorMessage } from './use-action-error';
import { useFocusAfterClose } from './use-focus-after-close';

export interface ResetPasswordButtonProps {
  studentUid: string;
  studentName: string;
  className: string;
}

/**
 * A new password after a confirmation, shown once. The page is refreshed when the credentials
 * dialog closes, so a refresh cannot unmount it while the password is on screen.
 */
export function ResetPasswordButton({
  studentUid,
  studentName,
  className,
}: ResetPasswordButtonProps) {
  const t = useTranslations('classes');
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
        // The refresh shows the "not in this class" page, without this button and its dialog:
        // close first, then the message as a toast and the focus on <main>.
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
        variant="secondary"
        onClick={() => {
          setError(null);
          setConfirmOpen(true);
        }}
      >
        <KeyRound aria-hidden="true" />
        {t('resetPassword.action')}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('resetPassword.confirmTitle', { name: studentName })}
        description={t('resetPassword.confirmDescription', { name: studentName })}
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
        title={t('credentials.resetTitle', { name: studentName })}
        className={className}
        credentials={credentials ?? []}
      />
    </>
  );
}
