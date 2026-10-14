'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { MailCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert, Button, LinkButton } from '@/components/ui';
import { sendVerificationEmail } from '@/lib/auth/client';
import { getClientAuth } from '@/lib/firebase/client';
import { AuthHeading } from './AuthHeading';
import { toActionError, useActionErrorMessage } from './errors';

const RESEND_COOLDOWN_SECONDS = 60;

// The Firebase client user lives in memory: it is there right after a sign-up or a refused
// login on this page load, and gone after a full page load. Without it nothing can be resent.
// Read as an external store so the server render (which cannot know) stays undecided.
function hasClientUser(): boolean {
  try {
    return getClientAuth().currentUser !== null;
  } catch {
    return false;
  }
}
const noSubscription = () => () => {};
const unknownOnServer = (): boolean | null => null;

/** "Check your inbox", with a resend button while the client user is still at hand. */
export function VerifyEmailNotice() {
  const t = useTranslations('auth');
  const errorMessage = useActionErrorMessage();
  const canResend = useSyncExternalStore<boolean | null>(
    noSubscription,
    hasClientUser,
    unknownOnServer,
  );
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [status, setStatus] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((left) => left - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function resend() {
    if (pending || cooldown > 0) return;
    setPending(true);
    setStatus(null);
    try {
      await sendVerificationEmail();
      setStatus({ tone: 'success', text: t('verifyEmail.resent') });
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (caught) {
      setStatus({ tone: 'danger', text: errorMessage(toActionError(caught)) });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeading
        icon={<MailCheck />}
        title={t('verifyEmail.title')}
        description={t('verifyEmail.description')}
      />

      {status && <Alert tone={status.tone}>{status.text}</Alert>}

      <p className="text-sm text-ink-muted">{t('verifyEmail.spam')}</p>

      {canResend === false && (
        <Alert tone="info" live="off">
          {t('verifyEmail.needLogin')}
        </Alert>
      )}

      <div className="flex flex-col gap-3">
        {canResend && (
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            loading={pending}
            disabled={cooldown > 0}
            onClick={resend}
          >
            {cooldown > 0
              ? t('verifyEmail.resendWait', { seconds: cooldown })
              : t('verifyEmail.resend')}
          </Button>
        )}
        <LinkButton href="/login" size="lg" fullWidth>
          {t('verifyEmail.login')}
        </LinkButton>
      </div>
    </div>
  );
}
