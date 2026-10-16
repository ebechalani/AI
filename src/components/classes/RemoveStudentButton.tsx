'use client';

import { useState } from 'react';
import { UserMinus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { removeStudentAction } from '@/actions/classes';
import { Button, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError } from '@/types/actions';
import { ConfirmDialog } from './ConfirmDialog';
import { useActionErrorMessage } from './use-action-error';
import { useFocusAfterClose } from './use-focus-after-close';

export interface RemoveStudentButtonProps {
  classId: string;
  className: string;
  studentUid: string;
  studentName: string;
  /** The pupil page passes the class page; the roster passes nothing (the row disappears). */
  redirectTo?: string;
  /** `row`: a small ghost button named with the student; `full`: a danger button. */
  variant?: 'row' | 'full';
}

/** Removes a student from the class (their account and progress stay). */
export function RemoveStudentButton({
  classId,
  className,
  studentUid,
  studentName,
  redirectTo,
  variant = 'row',
}: RemoveStudentButtonProps) {
  const t = useTranslations('classes');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const focusLater = useFocusAfterClose(open);

  function leave() {
    if (redirectTo !== undefined) router.push(redirectTo);
    // The row, and this button with it, disappears: focus goes to the roster's heading.
    else focusLater('roster-title');
    setOpen(false);
    router.refresh();
  }

  function report(failure: ActionError) {
    switch (failure.code) {
      case 'not_found':
        toast({ tone: 'warning', title: t('remove.errors.notFound') });
        leave();
        return;
      case 'forbidden':
        setError(t('remove.errors.forbidden'));
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
      const result = await removeStudentAction({ classId, studentUid });
      if (!result.ok) {
        report(result.error);
        return;
      }
      toast({
        tone: 'success',
        title: t('remove.success', { name: studentName, className }),
      });
      leave();
    } catch {
      report({ code: 'internal' });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {variant === 'row' ? (
        <Button
          size="sm"
          variant="ghost"
          aria-label={t('remove.actionLabel', { name: studentName })}
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
        >
          {t('remove.action')}
        </Button>
      ) : (
        <Button
          variant="danger"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
        >
          <UserMinus aria-hidden="true" />
          {t('remove.actionLabel', { name: studentName })}
        </Button>
      )}
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={t('remove.title', { name: studentName, className })}
        description={t('remove.description', { name: studentName })}
        confirmLabel={t('remove.confirm')}
        confirmVariant="danger"
        pending={pending}
        error={error}
        onConfirm={confirm}
      />
    </>
  );
}
