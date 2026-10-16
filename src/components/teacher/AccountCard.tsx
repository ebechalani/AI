import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Chip } from '@/components/ui';

export interface AccountCardProps {
  email: string | null;
  schoolless: boolean;
  verifiedEducator: boolean;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{label}</dt>
      <dd className="break-words text-ink">{children}</dd>
    </div>
  );
}

/** Email, role and, outside a school, the educator verification. */
export function AccountCard({ email, schoolless, verifiedEducator }: AccountCardProps) {
  const t = useTranslations('teacher');
  const tDomain = useTranslations('domain');
  const tCommon = useTranslations('common');

  return (
    <Card as="section" aria-labelledby="account-title" className="gap-4 p-5 sm:p-6">
      <h2 id="account-title" className="text-lg leading-snug font-bold text-ink">
        {t('settings.account.title')}
      </h2>
      <dl className="flex flex-col gap-3 text-sm">
        <Row label={t('settings.account.email')}>
          {email ?? tCommon('labels.notAvailable')}
        </Row>
        <Row label={t('settings.account.role')}>{tDomain('roles.teacher')}</Row>
        {schoolless && (
          <Row label={t('settings.account.verification')}>
            <span className="flex flex-col items-start gap-1.5">
              {verifiedEducator ? (
                <Chip tone="success">{t('settings.account.verified')}</Chip>
              ) : (
                <>
                  <Chip>{t('settings.account.notVerified')}</Chip>
                  <span className="text-ink-muted">{t('settings.account.notVerifiedHint')}</span>
                </>
              )}
            </span>
          </Row>
        )}
      </dl>
      {!schoolless && <p className="text-sm text-ink-muted">{t('settings.account.school')}</p>}
      <p className="text-sm text-ink-muted">{t('settings.account.passwordHint')}</p>
    </Card>
  );
}
