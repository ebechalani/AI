'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRight, Hash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { lookupJoinCodeAction } from '@/actions/auth';
import { Alert, Button, FormField, Input } from '@/components/ui';
import { lookupJoinCodeInputSchema } from '@/lib/schemas/auth';
import { parseInput } from '@/lib/schemas/common';
import type { ActionError } from '@/types/actions';
import { AuthHeading } from './AuthHeading';
import { AuthSwitch } from './AuthSwitch';
import { useActionErrorMessage, useFieldError } from './errors';

export interface JoinLookup {
  /** Normalised: upper case, no spaces or dashes. */
  joinCode: string;
  className: string;
  accountCreation: boolean;
  under13Allowed: boolean;
}

export interface JoinCodeStepProps {
  initialCode: string;
  /** Shown above the field on arrival, when a previous step sent the visitor back here. */
  initialNotice?: string | null;
  onFound: (lookup: JoinLookup) => void;
}

/** Step 1 of /join for a visitor: the class code, looked up before anything is typed. */
export function JoinCodeStep({ initialCode, initialNotice = null, onFound }: JoinCodeStepProps) {
  const t = useTranslations('auth');
  const fieldError = useFieldError();
  const errorMessage = useActionErrorMessage();
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [pending, setPending] = useState(false);
  const [codeError, setCodeError] = useState<string | undefined>(undefined);
  const [error, setError] = useState<ActionError | null>(null);
  const [notice, setNotice] = useState(initialNotice);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setNotice(null);

    const parsed = parseInput(lookupJoinCodeInputSchema, { joinCode: code });
    if (!parsed.success) {
      setCodeError(fieldError(parsed.fieldErrors, 'joinCode'));
      return;
    }
    setCodeError(undefined);

    setPending(true);
    try {
      const result = await lookupJoinCodeAction(parsed.data);
      if (!result.ok) {
        if (result.error.code === 'not_found') setCodeError(t('join.codeNotFound'));
        else setError(result.error);
        return;
      }
      onFound({ joinCode: parsed.data.joinCode, ...result.data });
    } catch {
      setError({ code: 'internal' });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <AuthHeading icon={<Hash />} title={t('join.title')} description={t('join.description')} />

      {notice && <Alert tone="warning">{notice}</Alert>}
      {error && <Alert tone="danger">{errorMessage(error)}</Alert>}

      <FormField label={t('join.code')} hint={t('join.codeHint')} error={codeError} required>
        <Input
          name="joinCode"
          autoComplete="off"
          autoCapitalize="characters"
          autoFocus
          spellCheck={false}
          maxLength={12}
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          className="font-mono tracking-[0.25em] uppercase"
        />
      </FormField>

      <Button type="submit" size="lg" fullWidth loading={pending}>
        {t('join.lookup')}
        {!pending && <ArrowRight aria-hidden="true" className="rtl:-scale-x-100" />}
      </Button>

      <div className="flex flex-col gap-1 border-t border-border pt-5">
        <AuthSwitch prompt={t('signup.haveAccount')} href="/login" label={t('signup.login')} />
      </div>
    </form>
  );
}
