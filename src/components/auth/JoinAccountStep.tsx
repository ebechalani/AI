'use client';

import { useState, type FormEvent } from 'react';
import { UserPlus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { joinClassSignupAction } from '@/actions/auth';
import { Alert, Button, Chip, FormField, Input } from '@/components/ui';
import { SELF_SIGNUP_AGE_BANDS } from '@/lib/limits';
import { joinSignupInputSchema } from '@/lib/schemas/auth';
import { parseInput } from '@/lib/schemas/common';
import type { ActionError } from '@/types/actions';
import { AGE_BANDS, type AgeBand } from '@/types/common';
import { AgeBandField } from './AgeBandField';
import { AuthHeading } from './AuthHeading';
import { useActionErrorMessage, useFieldError, type FieldErrors } from './errors';
import type { JoinLookup } from './JoinCodeStep';
import { PasswordField } from './PasswordField';
import { TermsField } from './TermsField';
import { suggestUsername } from './username';

export interface JoinAccountStepProps {
  lookup: JoinLookup;
  onDone: (account: { username: string; password: string }) => void;
  /** The code stopped working between the two steps. */
  onCodeInvalid: () => void;
  onChangeCode: () => void;
}

/** Step 2 of /join for a visitor: the username account created inside the class. */
export function JoinAccountStep({ lookup, onDone, onCodeInvalid, onChangeCode }: JoinAccountStepProps) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const fieldError = useFieldError();
  const errorMessage = useActionErrorMessage();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageBand, setAgeBand] = useState<AgeBand | ''>('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<ActionError | null>(null);
  const [refusal, setRefusal] = useState<'classFull' | 'notAllowed' | null>(null);

  const bands = lookup.under13Allowed ? AGE_BANDS : SELF_SIGNUP_AGE_BANDS;

  function onDisplayNameChange(value: string) {
    setDisplayName(value);
    if (!usernameEdited) setUsername(suggestUsername(value));
  }

  function usernameError(): string | undefined {
    if (fieldErrors.username?.[0] === 'duplicate') return t('join.usernameTaken');
    return fieldError(fieldErrors, 'username');
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setRefusal(null);

    const parsed = parseInput(joinSignupInputSchema, {
      joinCode: lookup.joinCode,
      displayName,
      username,
      password,
      ageBand,
      locale,
      acceptedTerms,
    });
    const errors: FieldErrors = parsed.success ? {} : { ...parsed.fieldErrors };
    if (confirmPassword !== password) errors.confirmPassword = ['passwords_mismatch'];
    setFieldErrors(errors);
    if (!parsed.success || Object.keys(errors).length > 0) return;

    setPending(true);
    try {
      const result = await joinClassSignupAction(parsed.data);
      if (!result.ok) {
        switch (result.error.code) {
          case 'validation':
            setFieldErrors(result.error.fieldErrors ?? {});
            break;
          case 'not_found':
            onCodeInvalid();
            return;
          case 'conflict':
            setRefusal('classFull');
            break;
          case 'forbidden':
            setRefusal('notAllowed');
            break;
          default:
            setError(result.error);
        }
        return;
      }
      onDone({ username: result.data.username, password: parsed.data.password });
    } catch {
      setError({ code: 'internal' });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="brand" size="md">
            {t('join.classFound', { className: lookup.className })}
          </Chip>
          <Button variant="ghost" size="sm" onClick={onChangeCode}>
            {t('join.changeCode')}
          </Button>
        </div>
        <AuthHeading title={t('join.account.title')} description={t('join.account.description')} />
      </div>

      {refusal && <Alert tone="warning">{t(`join.${refusal}`)}</Alert>}
      {error && <Alert tone="danger">{errorMessage(error)}</Alert>}

      <div className="flex flex-col gap-4">
        <FormField
          label={t('join.displayName')}
          hint={t('join.displayNameHint')}
          error={fieldError(fieldErrors, 'displayName')}
          required
        >
          <Input
            name="displayName"
            autoComplete="name"
            autoFocus
            value={displayName}
            onChange={(event) => onDisplayNameChange(event.target.value)}
          />
        </FormField>
        <FormField
          label={t('join.username')}
          hint={t('join.usernameHint')}
          error={usernameError()}
          required
        >
          <Input
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={(event) => {
              setUsernameEdited(true);
              setUsername(event.target.value.toLowerCase());
            }}
          />
        </FormField>
        <PasswordField
          label={t('join.password')}
          hint={t('join.passwordHint')}
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldError(fieldErrors, 'password')}
          required
        />
        <PasswordField
          label={t('join.confirmPassword')}
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={fieldError(fieldErrors, 'confirmPassword')}
          required
        />
        <AgeBandField
          legend={t('join.ageBand.legend')}
          bands={bands}
          value={ageBand}
          onChange={setAgeBand}
          error={fieldError(fieldErrors, 'ageBand')}
        />
        <TermsField
          checked={acceptedTerms}
          onChange={setAcceptedTerms}
          error={fieldError(fieldErrors, 'acceptedTerms')}
        />
      </div>

      <Button type="submit" size="lg" fullWidth loading={pending}>
        {!pending && <UserPlus aria-hidden="true" />}
        {t('join.submit')}
      </Button>
    </form>
  );
}
