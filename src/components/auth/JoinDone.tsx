'use client';

import { useState } from 'react';
import { PartyPopper, Rocket } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { createSessionAction } from '@/actions/session';
import { Alert, Button, LinkButton } from '@/components/ui';
import { signInWithIdentifier } from '@/lib/auth/client';
import { getPathname } from '@/lib/i18n/navigation';
import type { ActionError } from '@/types/actions';
import { AuthHeading } from './AuthHeading';
import { toActionError, useActionErrorMessage } from './errors';

export interface JoinDoneProps {
  className: string;
  username: string;
  /** Kept in memory for the one sign-in below; never rendered. */
  password: string;
}

/** The account exists: show the username once more, then sign the pupil in with one click. */
export function JoinDone({ className, username, password }: JoinDoneProps) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const errorMessage = useActionErrorMessage();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ActionError | null>(null);

  async function start() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const { idToken } = await signInWithIdentifier(username, password);
      const result = await createSessionAction({ idToken, next: null });
      if (!result.ok) {
        setError(result.error);
        setPending(false);
        return;
      }
      window.location.assign(getPathname({ href: result.data.redirectTo, locale }));
    } catch (caught) {
      setError(toActionError(caught));
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading
        icon={<PartyPopper />}
        title={t('join.done.title', { className })}
        description={t('join.done.description')}
      />

      <div className="rounded-control border border-brand-200 bg-brand-50 p-4">
        <p className="text-sm font-semibold text-ink-muted">{t('join.done.usernameLabel')}</p>
        <p className="mt-1 font-mono text-2xl font-bold break-all text-brand-800">{username}</p>
      </div>

      {error && <Alert tone="danger">{errorMessage(error)}</Alert>}

      <div className="flex flex-col gap-3">
        <Button size="lg" fullWidth loading={pending} onClick={start}>
          {!pending && <Rocket aria-hidden="true" />}
          {t('join.done.start')}
        </Button>
        <LinkButton href="/login" variant="ghost" fullWidth>
          {t('join.done.loginLater')}
        </LinkButton>
      </div>
    </div>
  );
}
