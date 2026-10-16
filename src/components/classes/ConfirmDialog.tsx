'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Alert, Button, Dialog, type ButtonVariant } from '@/components/ui';
import { DIALOG_TEXT } from './dialog';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  /** `danger` for a destructive confirmation. */
  confirmVariant?: ButtonVariant;
  pending: boolean;
  /** A failure, shown inline: the modal covers the toast region. */
  error: string | null;
  onConfirm: () => void;
}

/** A confirmation: Cancel takes the focus, the action runs on confirm, failures stay inline. */
export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  confirmVariant = 'primary',
  pending,
  error,
  onConfirm,
}: ConfirmDialogProps) {
  const tCommon = useTranslations('common');
  const errorRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const wasPending = useRef(false);

  // The confirm button is disabled while loading, which drops the focus to <body>. A failure
  // keeps the dialog open: the focus goes to the error (or back to the button) once the owner
  // has rendered it (7.3). A success closes the dialog, which returns the focus by itself.
  useEffect(() => {
    const settled = wasPending.current && !pending;
    wasPending.current = pending;
    if (!settled || !open) return;
    const active = document.activeElement;
    if (active !== null && active !== document.body) return;
    (errorRef.current ?? confirmRef.current)?.focus();
  }, [pending, open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      className={DIALOG_TEXT}
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending} data-autofocus>
            {tCommon('actions.cancel')}
          </Button>
          <Button ref={confirmRef} variant={confirmVariant} loading={pending} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {error !== null && (
        <div ref={errorRef} tabIndex={-1} className="outline-none">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
    </Dialog>
  );
}
