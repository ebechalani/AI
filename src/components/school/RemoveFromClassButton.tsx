'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { removeStudentAction } from '@/actions/classes';
import { ConfirmDialog } from '@/components/classes/ConfirmDialog';
import { Button, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError } from '@/types/actions';
import { MAIN_CONTENT_ID } from './focus';
import { useActionErrorMessage } from './use-action-error';
import { useFocusAfterClose } from './use-focus-after-close';

export interface RemoveFromClassButtonProps {
  classId: string;
  className: string;
  studentUid: string;
  studentName: string;
}

/** Removes a pupil from the class after a confirmation; the row disappears with this button. */
export function RemoveFromClassButton({
  classId,
  className,
  studentUid,
  studentName,
}: RemoveFromClassButtonProps) {
  const t = useTranslations('school');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const focusLater = useFocusAfterClose(open);

  /** Closes the dialog, puts the focus on `target` once it has closed, and refreshes. */
  function leave(target: string) {
    focusLater(target);
    setOpen(false);
    router.refresh();
  }

  function report(failure: ActionError) {
    switch (failure.code) {
      case 'not_found':
        toast({ tone: 'warning', title: t('class.remove.errors.notFound') });
        leave('roster-title');
        return;
      case 'conflict':
        // The class was archived meanwhile: the refresh turns the page read-only.
        toast({ tone: 'warning', title: t('class.archived.title') });
        leave(MAIN_CONTENT_ID);
        return;
      case 'forbidden':
        setError(t('class.remove.errors.forbidden'));
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
        title: t('class.remove.success', { name: studentName, className }),
      });
      leave('roster-title');
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
        aria-label={t('class.remove.actionLabel', { name: studentName })}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {t('class.remove.action')}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={t('class.remove.title', { name: studentName, className })}
        description={t('class.remove.description', { name: studentName })}
        confirmLabel={t('class.remove.confirm')}
        confirmVariant="danger"
        pending={pending}
        error={error}
        onConfirm={confirm}
      />
    </>
  );
}
