'use client';

import { useRef, useState } from 'react';
import { CirclePause, CirclePlay } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { setSchoolStatusAction } from '@/actions/admin';
import { ConfirmDialog } from '@/components/classes/ConfirmDialog';
import { Button, useToast } from '@/components/ui';
import { useRouter } from '@/lib/i18n/navigation';
import type { ActionError, ActionResult } from '@/types/actions';
import type { SchoolStatus } from '@/types/school';
import { settleAndRestoreFocus } from './focus';
import { useActionErrorMessage } from './use-action-error';

export interface SchoolStatusButtonProps {
  schoolId: string;
  name: string;
  status: SchoolStatus;
}

/**
 * Suspend (after a confirmation) or reactivate a school. One button element in both states,
 * so the refresh after a success changes its label in place and the focus stays on it.
 */
export function SchoolStatusButton({ schoolId, name, status }: SchoolStatusButtonProps) {
  const t = useTranslations('admin');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = status === 'active';

  function failureText(failure: ActionError): string {
    switch (failure.code) {
      case 'not_found':
        return t('shared.schoolGone');
      case 'unauthenticated':
        router.refresh();
        return tErrors('unauthenticated');
      default:
        return errorMessage(failure);
    }
  }

  async function run(next: SchoolStatus): Promise<ActionResult<null>> {
    try {
      return await setSchoolStatusAction({ schoolId, status: next });
    } catch {
      return { ok: false, error: { code: 'internal' } };
    }
  }

  async function suspend() {
    if (pending) return;
    setPending(true);
    setError(null);
    const result = await run('suspended');
    setPending(false);
    if (!result.ok) {
      setError(failureText(result.error));
      return;
    }
    setOpen(false);
    toast({ tone: 'success', title: t('schools.status.suspended', { name }) });
    router.refresh();
  }

  async function reactivate() {
    if (pending) return;
    setPending(true);
    const result = await run('active');
    settleAndRestoreFocus(
      () => setPending(false),
      () => buttonRef.current,
    );
    if (!result.ok) {
      toast({ tone: 'danger', title: failureText(result.error) });
      return;
    }
    toast({ tone: 'success', title: t('schools.status.reactivated', { name }) });
    router.refresh();
  }

  return (
    <>
      <Button
        ref={buttonRef}
        variant={active ? 'secondary' : 'primary'}
        loading={!active && pending}
        onClick={() => {
          if (active) {
            setError(null);
            setOpen(true);
          } else {
            void reactivate();
          }
        }}
      >
        {active ? <CirclePause aria-hidden="true" /> : <CirclePlay aria-hidden="true" />}
        {active ? t('schools.status.suspend') : t('schools.status.reactivate')}
      </Button>
      <ConfirmDialog
        open={open && active}
        onClose={() => setOpen(false)}
        title={t('schools.status.suspendTitle', { name })}
        description={t('schools.status.suspendDescription')}
        confirmLabel={t('schools.status.suspendConfirm')}
        confirmVariant="danger"
        pending={pending}
        error={error}
        onConfirm={suspend}
      />
    </>
  );
}
