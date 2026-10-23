'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { setVerifiedEducatorAction } from '@/actions/admin';
import { ConfirmDialog } from '@/components/classes/ConfirmDialog';
import { Button, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError, ActionResult } from '@/types/actions';
import { MAIN_CONTENT_ID } from './focus';
import { useActionErrorMessage } from './use-action-error';
import { useFocusAfterClose } from './use-focus-after-close';

export interface VerifyEducatorButtonProps {
  uid: string;
  name: string;
  verified: boolean;
}

/**
 * Verify a teacher as an educator, or remove the verification, both after a confirmation. One
 * button element in both states, so the focus stays on it across the refresh.
 */
export function VerifyEducatorButton({ uid, name, verified }: VerifyEducatorButtonProps) {
  const t = useTranslations('admin');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const focusLater = useFocusAfterClose(open);

  function report(failure: ActionError) {
    switch (failure.code) {
      case 'conflict':
        setError(t('users.verify.errors.conflict'));
        return;
      case 'not_found':
        toast({ tone: 'warning', title: t('users.verify.errors.notFound') });
        focusLater(MAIN_CONTENT_ID);
        setOpen(false);
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
    let result: ActionResult<null>;
    try {
      result = await setVerifiedEducatorAction({ uid, verified: !verified });
    } catch {
      result = { ok: false, error: { code: 'internal' } };
    }
    setPending(false);
    if (!result.ok) {
      report(result.error);
      return;
    }
    setOpen(false);
    toast({
      tone: 'success',
      title: verified ? t('users.verify.unverified', { name }) : t('users.verify.verified', { name }),
    });
    router.refresh();
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        aria-label={verified ? t('users.verify.unverifyLabel', { name }) : t('users.verify.verifyLabel', { name })}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {verified ? t('users.verify.unverify') : t('users.verify.verify')}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={verified ? t('users.verify.unverifyTitle', { name }) : t('users.verify.verifyTitle', { name })}
        description={
          verified ? t('users.verify.unverifyDescription', { name }) : t('users.verify.verifyDescription')
        }
        confirmLabel={verified ? t('users.verify.unverifyConfirm') : t('users.verify.verifyConfirm')}
        confirmVariant={verified ? 'danger' : 'primary'}
        pending={pending}
        error={error}
        onConfirm={confirm}
      />
    </>
  );
}
