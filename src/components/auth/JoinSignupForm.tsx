'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Alert, Button, LinkButton } from '@/components/ui';
import { AuthHeading } from './AuthHeading';
import { JoinAccountStep } from './JoinAccountStep';
import { JoinCodeStep, type JoinLookup } from './JoinCodeStep';
import { JoinDone } from './JoinDone';

export interface JoinSignupFormProps {
  /** A code carried in the link a teacher shared (`/join?code=XXXX`); may be anything. */
  initialCode?: string | null;
}

/**
 * /join for a visitor who is not signed in (ARCHITECTURE.md 1.5, path 2): code, then account,
 * then a one-click sign-in. A class that cannot create accounts gets an explanation instead
 * of the account step.
 */
export function JoinSignupForm({ initialCode = null }: JoinSignupFormProps) {
  const t = useTranslations('auth');
  const [lookup, setLookup] = useState<JoinLookup | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [account, setAccount] = useState<{ username: string; password: string } | null>(null);

  if (account !== null && lookup !== null) {
    return <JoinDone className={lookup.className} {...account} />;
  }

  if (lookup === null) {
    return (
      <JoinCodeStep
        initialCode={initialCode ?? ''}
        initialNotice={notice}
        onFound={(found) => {
          setNotice(null);
          setLookup(found);
        }}
      />
    );
  }

  if (!lookup.accountCreation) {
    return (
      <div className="flex flex-col gap-6">
        <AuthHeading title={t('join.title')} />
        <Alert tone="warning" title={t('join.noAccountCreation.title')} live="off">
          {t('join.noAccountCreation.description', { className: lookup.className })}
        </Alert>
        <div className="flex flex-col gap-3">
          <LinkButton href="/login" size="lg" fullWidth>
            {t('signup.login')}
          </LinkButton>
          <Button variant="ghost" onClick={() => setLookup(null)}>
            {t('join.changeCode')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <JoinAccountStep
      lookup={lookup}
      onDone={setAccount}
      onChangeCode={() => setLookup(null)}
      onCodeInvalid={() => {
        setNotice(t('join.codeNotFound'));
        setLookup(null);
      }}
    />
  );
}
