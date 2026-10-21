'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, useToast } from '@/components/ui';
import { settleAndRestoreFocus } from './focus';
import { sendPasswordEmail } from './password-email';
import { useActionErrorMessage } from './use-action-error';

export interface SendPasswordEmailButtonProps {
  email: string;
  name: string;
}

/** Sends a teacher the email to choose a (new) password. No server action, no refresh. */
export function SendPasswordEmailButton({ email, name }: SendPasswordEmailButtonProps) {
  const t = useTranslations('school');
  const { toast } = useToast();
  const errorMessage = useActionErrorMessage();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState(false);

  async function send() {
    if (pending) return;
    setPending(true);
    const failure = await sendPasswordEmail(email);
    settleAndRestoreFocus(
      () => setPending(false),
      () => buttonRef.current,
    );
    if (failure === null) toast({ tone: 'success', title: t('teachers.email.sent', { email }) });
    else toast({ tone: 'danger', title: errorMessage(failure) });
  }

  return (
    <Button
      ref={buttonRef}
      size="sm"
      variant="ghost"
      loading={pending}
      aria-label={t('teachers.email.actionLabel', { name })}
      onClick={send}
    >
      {t('teachers.email.action')}
    </Button>
  );
}
