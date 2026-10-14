'use client';

import { useState, type FormEvent } from 'react';
import { KeyRound, MailCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert, Button, FormField, Input, LinkButton } from '@/components/ui';
import { sendPasswordReset } from '@/lib/auth/client';
import { Link } from '@/lib/i18n/navigation';
import { accountEmailSchema } from '@/lib/schemas/auth';
import { obj, parseInput } from '@/lib/schemas/common';
import type { ActionError } from '@/types/actions';
import { AuthHeading } from './AuthHeading';
import { AuthSwitch } from './AuthSwitch';
import { toActionError, useActionErrorMessage, useFieldError, type FieldErrors } from './errors';

const emailFormSchema = obj({ email: accountEmailSchema });

/**
 * Firebase's own reset email, for email accounts. The result reads the same whether or not an
 * account exists, so the form cannot be used to find out who is registered. A username has no
 * mailbox: the pupil is told to ask their teacher, and nothing is sent.
 */
export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const fieldError = useFieldError();
  const errorMessage = useActionErrorMessage();
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<ActionError | null>(null);
  const [usernameNotice, setUsernameNotice] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setUsernameNotice(false);

    const value = email.trim();
    if (value !== '' && !value.includes('@')) {
      setFieldErrors({});
      setUsernameNotice(true);
      return;
    }
    const parsed = parseInput(emailFormSchema, { email: value });
    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      return;
    }
    setFieldErrors({});

    setPending(true);
    try {
      await sendPasswordReset(parsed.data.email);
      setSentTo(parsed.data.email);
    } catch (caught) {
      setError(toActionError(caught));
    } finally {
      setPending(false);
    }
  }

  if (sentTo !== null) {
    return (
      <div className="flex flex-col gap-6">
        <AuthHeading
          icon={<MailCheck />}
          title={t('forgotPassword.sent.title')}
          description={t('forgotPassword.sent.description', { email: sentTo })}
        />
        <div className="flex flex-col gap-3">
          <LinkButton href="/login" size="lg" fullWidth>
            {t('forgotPassword.backToLogin')}
          </LinkButton>
          <Button
            variant="ghost"
            onClick={() => {
              setSentTo(null);
              setEmail('');
            }}
          >
            {t('forgotPassword.sent.again')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <AuthHeading
        icon={<KeyRound />}
        title={t('forgotPassword.title')}
        description={t('forgotPassword.description')}
      />

      {error && <Alert tone="danger">{errorMessage(error)}</Alert>}
      {usernameNotice && <Alert tone="info">{t('forgotPassword.usernameNotice')}</Alert>}

      <FormField
        label={t('forgotPassword.email')}
        error={fieldError(fieldErrors, 'email')}
        required
      >
        <Input
          type="email"
          name="email"
          autoComplete="email"
          autoCapitalize="none"
          autoFocus
          spellCheck={false}
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </FormField>

      <Button type="submit" size="lg" fullWidth loading={pending}>
        {t('forgotPassword.submit')}
      </Button>

      <div className="flex flex-col gap-1 border-t border-border pt-5">
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center self-center rounded-sm text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
        >
          {t('forgotPassword.backToLogin')}
        </Link>
        <AuthSwitch prompt={t('login.noAccount')} href="/signup" label={t('login.signup')} />
      </div>
    </form>
  );
}
