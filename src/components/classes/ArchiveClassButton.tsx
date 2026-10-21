'use client';

import { useState } from 'react';
import { Archive } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { archiveClassAction } from '@/actions/classes';
import { Button, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError } from '@/types/actions';
import { ConfirmDialog } from './ConfirmDialog';
import { useActionErrorMessage } from './use-action-error';

export interface ArchiveClassButtonProps {
  classId: string;
  className: string;
  /** Locale-less path to load once the class is archived (the classes list). */
  redirectTo: string;
}

/** Archives the class after a confirmation; it cannot be restored. */
export function ArchiveClassButton({ classId, className, redirectTo }: ArchiveClassButtonProps) {
  const t = useTranslations('classes');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function report(failure: ActionError) {
    if (failure.code === 'not_found') {
      setOpen(false);
      toast({ tone: 'warning', title: t('errors.classGone') });
      router.push(redirectTo);
      router.refresh();
      return;
    }
    if (failure.code === 'unauthenticated') {
      setError(tErrors('unauthenticated'));
      router.refresh();
      return;
    }
    setError(errorMessage(failure));
  }

  async function confirm() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await archiveClassAction({ classId });
      if (!result.ok) {
        report(result.error);
        return;
      }
      setOpen(false);
      toast({ tone: 'success', title: t('archive.success', { name: className }) });
      router.push(redirectTo);
      router.refresh();
    } catch {
      report({ code: 'internal' });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        variant="danger"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        <Archive aria-hidden="true" />
        {t('archive.action')}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={t('archive.title', { name: className })}
        description={t('archive.description')}
        confirmLabel={t('archive.confirm')}
        confirmVariant="danger"
        pending={pending}
        error={error}
        onConfirm={confirm}
      />
    </>
  );
}
