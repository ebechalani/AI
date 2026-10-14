'use client';

import { useState, type FormEvent } from 'react';
import { LogIn } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { createSessionAction } from '@/actions/session';
import { Alert, Button, FormField, Input, LinkButton } from '@/components/ui';
import { sendVerificationEmail, signInWithIdentifier } from '@/lib/auth/client';
import { getPathname, Link, useRouter } from '@/lib/i18n/navigation';
import type { ActionError } from '@/types/actions';
import { AuthHeading } from './AuthHeading';
import { AuthSwitch } from './AuthSwitch';
import { toActionError, useActionErrorMessage, useFieldError, type FieldErrors } from './errors';
import { PasswordField } from './PasswordField';

export interface LoginFormProps {
  /** The `next` query parameter, judged by the server (safeNextPath); never trusted here. */
  next: string | null;
}

/**
 * Email-or-username + password. A pupil types the username their teacher gave them and
 * signInWithIdentifier() appends the student email domain. After the session cookie is set
 * the browser does a full page load, so the proxy sees the cookie and nothing of the previous
 * visitor stays in memory on a shared computer.
 */
export function LoginForm({ next }: LoginFormProps) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const fieldError = useFieldError();
  const errorMessage = useActionErrorMessage();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<ActionError | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const missing: FieldErrors = {};
    if (identifier.trim() === '') missing.identifier = ['required'];
    if (password === '') missing.password = ['required'];
    setFieldErrors(missing);
    setError(null);
    if (Object.keys(missing).length > 0) return;

    setPending(true);
    try {
      const { idToken } = await signInWithIdentifier(identifier, password);
      const result = await createSessionAction({ idToken, next });
      if (!result.ok) {
        if (result.error.code === 'email_unverified') {
          // The client user is still signed in, so the link can be sent now; a client
          // navigation keeps that user in memory for the resend button of the next page.
          await sendVerificationEmail().catch(() => undefined);
          router.push('/verify-email');
          return;
        }
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
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <AuthHeading title={t('login.title')} description={t('login.description')} />

      {error && (
        <Alert
          tone="danger"
          action={
            error.code === 'profile_missing' ? (
              <LinkButton href="/signup" variant="secondary" size="sm">
                {t('login.finishSignup')}
              </LinkButton>
            ) : undefined
          }
        >
          {/* Here "unauthenticated" means the credentials did not match, not an ended session. */}
          {error.code === 'unauthenticated' ? t('login.invalidCredentials') : errorMessage(error)}
        </Alert>
      )}

      <div className="flex flex-col gap-4">
        <FormField
          label={t('login.identifier')}
          hint={t('login.identifierHint')}
          error={fieldError(fieldErrors, 'identifier')}
          required
        >
          <Input
            name="identifier"
            autoComplete="username"
            autoCapitalize="none"
            autoFocus
            spellCheck={false}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
          />
        </FormField>
        <PasswordField
          label={t('login.password')}
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldError(fieldErrors, 'password')}
          required
        />
      </div>

      <div className="flex flex-col gap-3">
        <Button type="submit" size="lg" fullWidth loading={pending}>
          {!pending && <LogIn aria-hidden="true" className="rtl:-scale-x-100" />}
          {t('login.submit')}
        </Button>
        <Link
          href="/forgot-password"
          className="inline-flex min-h-11 items-center self-center rounded-sm text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
        >
          {t('login.forgotPassword')}
        </Link>
      </div>

      <div className="flex flex-col gap-1 border-t border-border pt-5">
        <AuthSwitch prompt={t('login.noAccount')} href="/signup" label={t('login.signup')} />
        <AuthSwitch prompt={t('login.haveCode')} href="/join" label={t('login.join')} />
      </div>
    </form>
  );
}
