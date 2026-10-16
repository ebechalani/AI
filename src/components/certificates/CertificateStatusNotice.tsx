import { useTranslations } from 'next-intl';
import { useDateFormat } from '@/components/domain';
import { Alert } from '@/components/ui';
import type { Certificate } from '@/types/gamification';

export interface CertificateStatusNoticeProps {
  certificate: Pick<Certificate, 'status' | 'revokedAt' | 'updatedAt' | 'revokedReason'>;
}

/**
 * Whether the certificate is valid; for a revoked one, since when and why (the holder sees the
 * reason too). Focusable from script: the toolbar moves focus here after a revoke or re-issue.
 */
export function CertificateStatusNotice({ certificate }: CertificateStatusNoticeProps) {
  const t = useTranslations('certificates');
  const formatDate = useDateFormat();
  return (
    <div
      id="certificate-status"
      tabIndex={-1}
      className="rounded-card outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 print:hidden"
    >
      {certificate.status === 'issued' ? (
        <Alert tone="success" live="off" title={t('page.status.issuedTitle')}>
          {t('page.status.issued')}
        </Alert>
      ) : (
        <Alert
          tone="danger"
          live="off"
          title={t('page.status.revokedTitle', {
            date: formatDate(certificate.revokedAt ?? certificate.updatedAt, 'dateLong'),
          })}
        >
          <p>{t('page.status.revoked')}</p>
          {certificate.revokedReason && (
            <p className="mt-1 break-words">
              {t('page.status.reason', { reason: certificate.revokedReason })}
            </p>
          )}
        </Alert>
      )}
    </div>
  );
}
