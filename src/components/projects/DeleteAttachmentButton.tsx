'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { deleteAttachmentAction } from '@/actions/files';
import { Alert, Button, Dialog, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError } from '@/types/actions';
import type { FileRef } from '@/types/common';
import { focusInView, focusWasLost } from './focus';
import { useActionErrorMessage } from './use-action-error';

export interface DeleteAttachmentButtonProps {
  submissionId: string;
  file: FileRef;
}

/**
 * Deletes one attachment after a confirmation: the owner before the review, a reviewing teacher
 * at any time. After the refresh the attachments heading (or the work heading, when the list is
 * gone) takes focus (RefocusHeading).
 */
export function DeleteAttachmentButton({ submissionId, file }: DeleteAttachmentButtonProps) {
  const t = useTranslations('projects');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ActionError | null>(null);
  const [refocus, setRefocus] = useState(0);
  const alertRef = useRef<HTMLDivElement>(null);

  // The loading confirm button was natively disabled, so focus is lost inside the dialog: the
  // error that replaces it takes focus.
  useEffect(() => {
    if (refocus === 0) return;
    if (focusWasLost(alertRef.current?.closest('dialog') ?? null)) focusInView(alertRef.current);
  }, [refocus]);

  function close() {
    if (pending) return;
    setOpen(false);
    setError(null);
  }

  async function confirm() {
    if (pending) return;
    setPending(true);
    setError(null);
    let failure: ActionError;
    try {
      const result = await deleteAttachmentAction({ submissionId, fileId: file.fileId });
      if (result.ok) {
        setOpen(false);
        toast({ tone: 'success', title: t('attachments.deleted') });
        router.refresh();
        return;
      }
      failure = result.error;
    } catch {
      failure = { code: 'internal' };
    } finally {
      setPending(false);
    }
    if (failure.code === 'not_found') {
      setOpen(false);
      toast({ tone: 'warning', title: t('attachments.errors.gone') });
      router.refresh();
      return;
    }
    setError(failure);
    setRefocus((count) => count + 1);
    if (failure.code === 'unauthenticated') router.refresh();
  }

  return (
    <>
      {/* The name starts with the visible word (WCAG 2.5.3) and says which file. */}
      <Button
        variant="ghost"
        size="sm"
        className="text-danger!"
        aria-label={t('attachments.deleteName', { name: file.fileName })}
        onClick={() => setOpen(true)}
      >
        <Trash2 aria-hidden="true" />
        {tCommon('actions.delete')}
      </Button>
      <Dialog
        open={open}
        onClose={close}
        size="sm"
        dismissible={!pending}
        title={t('attachments.deleteDialog.title')}
        description={t('attachments.deleteDialog.description', { name: file.fileName })}
        footer={
          <>
            <Button variant="secondary" data-autofocus="" disabled={pending} onClick={close}>
              {tCommon('actions.cancel')}
            </Button>
            <Button variant="danger" loading={pending} onClick={confirm}>
              {t('attachments.deleteDialog.confirm')}
            </Button>
          </>
        }
      >
        {error !== null && (
          <div ref={alertRef} tabIndex={-1} className="rounded-control">
            <Alert tone="danger">
              {error.code === 'forbidden' ? t('attachments.errors.forbidden') : errorMessage(error)}
            </Alert>
          </div>
        )}
      </Dialog>
    </>
  );
}
