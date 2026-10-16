import { useTranslations } from 'next-intl';
import type { AgeBand } from '@/types/common';
import { accountIdentifier } from './settings-model';

export interface AccountFactsProps {
  username: string | null;
  email: string | null;
  ageBand: AgeBand;
}

/** How the student signs in and their age group: shown, not editable here. */
export function AccountFacts({ username, email, ageBand }: AccountFactsProps) {
  const t = useTranslations('settings');
  const tDomain = useTranslations('domain');
  const identifier = accountIdentifier({ username, email });

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid gap-x-4 gap-y-3 text-sm sm:grid-cols-[auto_1fr]">
        {identifier && (
          <>
            <dt className="font-medium text-ink-muted">
              {t(identifier.kind === 'username' ? 'account.username' : 'account.email')}
            </dt>
            {/* Typed to sign in, so shown exactly: no contextual alternates (Inter draws the x of
                "8x9" as a multiplication sign) and never translated. */}
            <dd
              translate="no"
              className="min-w-0 font-semibold break-all text-ink [font-feature-settings:'calt'_0]"
            >
              {identifier.value}
            </dd>
          </>
        )}
        <dt className="font-medium text-ink-muted">{t('account.ageBand')}</dt>
        <dd className="min-w-0 font-semibold text-ink">{tDomain(`ageBands.${ageBand}`)}</dd>
      </dl>
      <div className="flex flex-col gap-1 text-sm text-ink-muted">
        <p>{t(username ? 'account.passwordUsername' : 'account.passwordEmail')}</p>
        <p>{t('account.readOnly')}</p>
      </div>
    </div>
  );
}
