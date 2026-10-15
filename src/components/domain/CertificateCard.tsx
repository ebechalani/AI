import { ArrowRight, Award } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import type { Certificate } from '@/types/gamification';
import { CertifiedBadge } from './CertifiedBadge';
import { useDateFormat } from './format';
import { StatusChip } from './StatusChip';

export interface CertificateCardProps {
  certificate: Certificate;
  /** Locale-less path of the printable certificate. */
  href: string;
  className?: string;
}

export function CertificateCard({ certificate, href, className }: CertificateCardProps) {
  const locale = useLocale();
  const t = useTranslations('domain');
  const formatDate = useDateFormat();
  // The title was snapshotted in every language the course had; fall back to English.
  const { title } = pickTranslation(certificate.courseTitle, locale, 'en');
  const revoked = certificate.status === 'revoked';

  return (
    <Card
      as="article"
      tone={revoked ? 'muted' : 'brand'}
      interactive
      className={cn('h-full gap-4 p-5 sm:p-6', className)}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-full',
            revoked ? 'bg-border text-ink-muted' : 'bg-brand-600 text-white',
          )}
        >
          <Award className="size-6" />
        </span>
        <div className="flex min-w-0 flex-col gap-2">
          <h3 className="text-base leading-snug font-semibold text-ink">{title}</h3>
          {(certificate.isOfficial || revoked) && (
            <div className="flex flex-wrap items-center gap-2">
              {certificate.isOfficial && <CertifiedBadge />}
              {revoked && <StatusChip status="revoked" />}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm text-ink-muted">
        <p>{t('certificate.issuedOn', { date: formatDate(certificate.issuedAt, 'dateLong') })}</p>
        <p>{t('certificate.issuedBy', { name: certificate.issuerName })}</p>
        <p>
          {t.rich('certificate.code', {
            code: certificate.verificationCode,
            // The code is copied to verify the certificate, so it is never split: on a narrow
            // card it moves to its own line and only the label wraps.
            nowrap: (chunks) => (
              <span translate="no" className="whitespace-nowrap">
                {chunks}
              </span>
            ),
          })}
        </p>
      </div>

      <Link
        href={href}
        className="mt-auto inline-flex items-center gap-1.5 self-start rounded-sm text-sm font-semibold text-brand-700 after:absolute after:inset-0 after:rounded-card"
      >
        {t('certificate.view')}
        <span className="sr-only">: {title}</span>
        <ArrowRight aria-hidden="true" className="size-4 rtl:rotate-180" />
      </Link>
    </Card>
  );
}
