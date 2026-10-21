import type { ReactNode } from 'react';
import { SearchX, ShieldCheck, ShieldX } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { CertifiedBadge, StatusChip, useDateFormat } from '@/components/domain';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { PublicCertificate } from '@/types/gamification';
import { certificateTitle } from './certificate-model';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="font-medium text-ink-muted">{label}</dt>
      <dd className="min-w-0 break-words text-ink">{children}</dd>
    </>
  );
}

export interface VerificationResultProps {
  /** The redacted certificate (never the learner's name), or null when no code matches. */
  certificate: PublicCertificate | null;
  /** The code as looked up, echoed in the not-found state. */
  code: string;
}

/** The public answer of `/verify/{code}`: valid, revoked, or no certificate found (6.1). */
export function VerificationResult({ certificate, code }: VerificationResultProps) {
  const t = useTranslations('certificates');
  const locale = useLocale();
  const formatDate = useDateFormat();

  let result: ReactNode;
  if (certificate === null) {
    // The code is echoed on one line (it is checked character by character): the message is
    // split around it so the code can carry its own no-wrap span.
    const marker = '\u0000code\u0000';
    const [before, after = ''] = t('verify.notFound.description', { code: marker }).split(marker);
    result = (
      <div className="flex flex-col items-center rounded-card border border-dashed border-ink-muted/40 bg-surface-muted/50 px-6 py-10 text-center">
        <span
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-full bg-brand-100 text-brand-600"
        >
          <SearchX className="size-7" />
        </span>
        <h2 className="mt-4 text-base font-semibold text-ink">{t('verify.notFound.title')}</h2>
        <p className="mt-1 max-w-sm text-sm break-words text-ink-muted">
          {before}
          {/* A real code (13 characters) never splits; a long string typed in the URL may. */}
          <span
            translate="no"
            className={cn('font-mono', code.length <= 16 ? 'whitespace-nowrap' : 'break-all')}
          >
            {code || '—'}
          </span>
          {after}
        </p>
      </div>
    );
  } else {
    const issued = certificate.status === 'issued';
    const Icon = issued ? ShieldCheck : ShieldX;
    result = (
      <Card as="section" aria-labelledby="verify-result" className="gap-5 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className={cn(
              'flex size-12 shrink-0 items-center justify-center rounded-full',
              issued ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
            )}
          >
            <Icon className="size-6" />
          </span>
          <div className="flex min-w-0 flex-col items-start gap-2">
            <h2 id="verify-result" className="text-xl font-semibold text-ink">
              {t(issued ? 'verify.valid.title' : 'verify.revoked.title')}
            </h2>
            <StatusChip status={certificate.status} />
            <p className="text-sm text-ink-muted">
              {t(issued ? 'verify.valid.description' : 'verify.revoked.description')}
            </p>
          </div>
        </div>
        <dl className="grid gap-x-4 gap-y-3 text-sm sm:grid-cols-[auto_1fr]">
          <Row label={t('verify.course')}>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold">{certificateTitle(certificate, locale)}</span>
              {certificate.isOfficial && <CertifiedBadge />}
            </span>
          </Row>
          <Row label={t('verify.issuedOn')}>{formatDate(certificate.issuedAt, 'dateLong')}</Row>
          <Row label={t('verify.issuer')}>{certificate.issuerName}</Row>
          {certificate.schoolName && <Row label={t('verify.school')}>{certificate.schoolName}</Row>}
          <Row label={t('verify.code')}>
            <span translate="no" className="font-mono whitespace-nowrap">
              {certificate.verificationCode}
            </span>
          </Row>
        </dl>
      </Card>
    );
  }

  return (
    <>
      {result}
      <p className="mt-6 text-sm text-ink-muted">{t('verify.privacy')}</p>
    </>
  );
}
