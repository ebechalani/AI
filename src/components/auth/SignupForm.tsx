'use client';

import { useState, type FormEvent } from 'react';
import { UserPlus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { completeSignupAction } from '@/actions/auth';
import { Alert, Button, FormField, Input, LinkButton, RadioGroup } from '@/components/ui';
import { sendVerificationEmail, signInWithIdentifier, signUpWithEmail } from '@/lib/auth/client';
import { isAppError } from '@/lib/errors';
import { Link, useRouter } from '@/lib/i18n/navigation';
import { SELF_SIGNUP_AGE_BANDS } from '@/lib/limits';
import { accountEmailSchema, passwordSchema, signupInputSchema } from '@/lib/schemas/auth';
import { obj, parseInput } from '@/lib/schemas/common';
import type { ActionError } from '@/types/actions';
import type { AgeBand } from '@/types/common';
import type { SignupInput } from '@/types/inputs';
import { AgeBandField } from './AgeBandField';
import { AuthHeading } from './AuthHeading';
import { AuthSwitch } from './AuthSwitch';
import { toActionError, useActionErrorMessage, useFieldError, type FieldErrors } from './errors';
import { PasswordField } from './PasswordField';
import { TermsField } from './TermsField';

export type SignupRole = SignupInput['role'];

export interface SignupFormProps {
  initialRole: SignupRole;
}

// The Auth account is created by the browser, so the email and password are checked here with
// the same field schemas the server uses elsewhere; the profile fields go through
// signupInputSchema, exactly as completeSignupAction will parse them.
const credentialsSchema = obj({ email: accountEmailSchema, password: passwordSchema });

/**
 * Self sign-up (ARCHITECTURE.md 1.5, path 1): create the Auth user, write the profile through
 * completeSignupAction, send the verification link, show /verify-email. No session exists
 * until the address is confirmed.
 */
export function SignupForm({ initialRole }: SignupFormProps) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const fieldError = useFieldError();
  const errorMessage = useActionErrorMessage();

  const [role, setRole] = useState<SignupRole>(initialRole);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageBand, setAgeBand] = useState<AgeBand | ''>('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<ActionError | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);

  function validate(): { profile: SignupInput; email: string; password: string } | null {
    const profileInput = {
      displayName,
      role,
      ageBand: role === 'teacher' ? 'adult' : ageBand,
      locale,
      acceptedTerms,
    };
    const profile = parseInput(signupInputSchema, profileInput);
    const credentials = parseInput(credentialsSchema, { email, password });
    const errors: FieldErrors = {
      ...(profile.success ? {} : profile.fieldErrors),
      ...(credentials.success ? {} : credentials.fieldErrors),
    };
    if (confirmPassword !== password) errors.confirmPassword = ['passwords_mismatch'];
    setFieldErrors(errors);
    if (!profile.success || !credentials.success || Object.keys(errors).length > 0) return null;
    return { profile: profile.data, ...credentials.data };
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setEmailTaken(false);
    const valid = validate();
    if (valid === null) return;

    setPending(true);
    try {
      let idToken: string;
      try {
        ({ idToken } = await signUpWithEmail(valid.email, valid.password));
      } catch (caught) {
        if (!(isAppError(caught) && caught.code === 'conflict')) throw caught;
        // The address is registered already. With the same password this is a sign-up that
        // was cut off before its profile was written, and it can be finished now; any other
        // case is an existing account.
        try {
          ({ idToken } = await signInWithIdentifier(valid.email, valid.password));
        } catch {
          setEmailTaken(true);
          setPending(false);
          return;
        }
      }
      const result = await completeSignupAction({ idToken, ...valid.profile });
      if (!result.ok) {
        if (result.error.code === 'conflict') setEmailTaken(true);
        else setError(result.error);
        setPending(false);
        return;
      }
      // Best effort: the verify-email page can send the link again.
      await sendVerificationEmail().catch(() => undefined);
      router.push(result.data.redirectTo);
    } catch (caught) {
      setError(toActionError(caught));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <AuthHeading title={t('signup.title')} description={t('signup.description')} />

      {emailTaken && (
        <Alert
          tone="warning"
          action={
            <LinkButton href="/login" variant="secondary" size="sm">
              {t('signup.login')}
            </LinkButton>
          }
        >
          {t('signup.emailTaken')}
        </Alert>
      )}
      {error && <Alert tone="danger">{errorMessage(error)}</Alert>}

      <RadioGroup
        legend={t('signup.role.legend')}
        name="role"
        variant="card"
        required
        options={[
          {
            value: 'student',
            label: t('signup.role.student'),
            description: t('signup.role.studentDescription'),
          },
          {
            value: 'teacher',
            label: t('signup.role.teacher'),
            description: t('signup.role.teacherDescription'),
          },
        ]}
        value={role}
        onValueChange={(value) => setRole(value as SignupRole)}
      />

      <div className="flex flex-col gap-4">
        <FormField
          label={t('signup.displayName')}
          hint={t('signup.displayNameHint')}
          error={fieldError(fieldErrors, 'displayName')}
          required
        >
          <Input
            name="displayName"
            autoComplete="name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </FormField>
        <FormField
          label={t('signup.email')}
          hint={t('signup.emailHint')}
          error={fieldError(fieldErrors, 'email')}
          required
        >
          <Input
            type="email"
            name="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </FormField>
        <PasswordField
          label={t('signup.password')}
          hint={t('signup.passwordHint')}
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldError(fieldErrors, 'password')}
          required
        />
        <PasswordField
          label={t('signup.confirmPassword')}
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={fieldError(fieldErrors, 'confirmPassword')}
          required
        />
        {role === 'student' && (
          <AgeBandField
            legend={t('signup.ageBand.legend')}
            bands={SELF_SIGNUP_AGE_BANDS}
            value={ageBand}
            onChange={setAgeBand}
            error={fieldError(fieldErrors, 'ageBand')}
            hint={
              <>
                {t('signup.ageBand.hint')}{' '}
                <Link
                  href="/join"
                  className="font-semibold text-brand-700 underline-offset-4 hover:underline"
                >
                  {t('signup.ageBand.join')}
                </Link>
              </>
            }
          />
        )}
        <TermsField
          checked={acceptedTerms}
          onChange={setAcceptedTerms}
          error={fieldError(fieldErrors, 'acceptedTerms')}
        />
      </div>

      <Button type="submit" size="lg" fullWidth loading={pending}>
        {!pending && <UserPlus aria-hidden="true" />}
        {t('signup.submit')}
      </Button>

      <div className="border-t border-border pt-5">
        <AuthSwitch prompt={t('signup.haveAccount')} href="/login" label={t('signup.login')} />
      </div>
    </form>
  );
}
