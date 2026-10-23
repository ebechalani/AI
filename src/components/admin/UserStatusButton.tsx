'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { setUserStatusAction } from '@/actions/admin';
import { ConfirmDialog } from '@/components/classes/ConfirmDialog';
import { Button, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError, ActionResult } from '@/types/actions';
import type { UserStatus } from '@/types/user';
import { MAIN_CONTENT_ID, settleAndRestoreFocus } from './focus';
import { useActionErrorMessage } from './use-action-error';
import { useFocusAfterClose } from './use-focus-after-close';

export interface UserStatusButtonProps {
  uid: string;
  name: string;
  status: UserStatus;
}

/**
 * Disable (after a confirmation) or enable an account. One button element in both states, so
 * the refresh after a success changes its label in place and the focus stays on it.
 */
export function UserStatusButton({ uid, name, status }: UserStatusButtonProps) {
  const t = useTranslations('admin');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const focusLater = useFocusAfterClose(open);
  const active = status === 'active';

  /**
   * The text of a failure, or null when the failure was handled another way. `fromDialog` says
   * whether the confirmation dialog is open (Disable) or not (Enable, which has none).
   */
  function failureText(failure: ActionError, fromDialog: boolean): string | null {
    switch (failure.code) {
      case 'forbidden':
        return t('users.status.errors.forbidden');
      case 'not_found':
        // The refresh drops the row and this button with it, so the focus goes to <main>: after
        // the dialog has closed when there is one, at once otherwise (no close to wait for).
        toast({ tone: 'warning', title: t('users.status.errors.notFound') });
        if (fromDialog) {
          focusLater(MAIN_CONTENT_ID);
          setOpen(false);
        } else {
          document.getElementById(MAIN_CONTENT_ID)?.focus();
        }
        router.refresh();
        return null;
      case 'unauthenticated':
        router.refresh();
        return tErrors('unauthenticated');
      default:
        return errorMessage(failure);
    }
  }

  async function run(next: UserStatus): Promise<ActionResult<null>> {
    try {
      return await setUserStatusAction({ uid, status: next });
    } catch {
      return { ok: false, error: { code: 'internal' } };
    }
  }

  async function disable() {
    if (pending) return;
    setPending(true);
    setError(null);
    const result = await run('disabled');
    setPending(false);
    if (!result.ok) {
      const text = failureText(result.error, true);
      if (text !== null) setError(text);
      return;
    }
    setOpen(false);
    toast({ tone: 'success', title: t('users.status.disabled', { name }) });
    router.refresh();
  }

  async function enable() {
    if (pending) return;
    setPending(true);
    const result = await run('active');
    settleAndRestoreFocus(
      () => setPending(false),
      () => buttonRef.current,
    );
    if (!result.ok) {
      const text = failureText(result.error, false);
      if (text !== null) toast({ tone: 'danger', title: text });
      return;
    }
    toast({ tone: 'success', title: t('users.status.enabled', { name }) });
    router.refresh();
  }

  return (
    <>
      <Button
        ref={buttonRef}
        size="sm"
        variant={active ? 'ghost' : 'secondary'}
        loading={!active && pending}
        aria-label={active ? t('users.status.disableLabel', { name }) : t('users.status.enableLabel', { name })}
        onClick={() => {
          if (active) {
            setError(null);
            setOpen(true);
          } else {
            void enable();
          }
        }}
      >
        {active ? t('users.status.disable') : t('users.status.enable')}
      </Button>
      <ConfirmDialog
        open={open && active}
        onClose={() => setOpen(false)}
        title={t('users.status.title', { name })}
        description={t('users.status.description', { name })}
        confirmLabel={t('users.status.confirm')}
        confirmVariant="danger"
        pending={pending}
        error={error}
        onConfirm={disable}
      />
    </>
  );
}
