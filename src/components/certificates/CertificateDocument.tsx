import { useLocale, useTranslations } from 'next-intl';
import { CertifiedBadge, useDateFormat } from '@/components/domain';
import { Logo } from '@/components/ui';
import type { Certificate } from '@/types/gamification';
import { certificateTitle } from './certificate-model';

export interface CertificateDocumentProps {
  certificate: Certificate;
  /** The absolute URL of the public verification page, printed on the document. */
  verifyUrl: string;
}

// One A4 landscape sheet when printed (globals.css is not this workstream's: the page rule
// travels with the document). A plain <style>, rendered in place: React removes it with the
// certificate. A hoisted one (href + precedence) would stay in the head after an in-app
// navigation and print every later page of the tab in landscape. While a certificate is on the
// page, nothing fixed on the screen (a toast such as "Copied to the clipboard") is printed
// over it.
const PRINT_CSS =
  '@page { size: A4 landscape; margin: 10mm; } ' +
  '@media print { body:has([data-certificate]) .fixed { display: none !important; } }';

/**
 * The certificate itself (ARCHITECTURE.md 7.7), as printed and saved as a PDF: recipient,
 * course, date, issuer, verification code and URL. Server-compatible. On phones it stacks; from
 * `md` it is a landscape sheet. It never clips: an aspect-ratio box keeps its automatic minimum
 * height only while its overflow is visible, so a long name or title makes it taller instead.
 */
export function CertificateDocument({ certificate, verifyUrl }: CertificateDocumentProps) {
  const t = useTranslations('certificates');
  const locale = useLocale();
  const formatDate = useDateFormat();
  const revoked = certificate.status === 'revoked';
  const officialSchool = certificate.isOfficial ? certificate.schoolName : null;

  return (
    <>
      <style>{PRINT_CSS}</style>
      <article
        aria-labelledby="certificate-title"
        data-certificate=""
        className="relative flex flex-col items-center gap-5 rounded-card border-2 border-brand-200 bg-surface px-5 py-8 text-center shadow-card [print-color-adjust:exact] sm:px-10 md:aspect-[297/210] md:justify-between md:gap-4 md:py-10 print:aspect-auto print:h-[186mm] print:w-full print:rounded-none print:shadow-none"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-2 rounded-[calc(var(--radius-card)-0.25rem)] border border-brand-100 sm:inset-3"
        />
        <Logo height={32} label="RoboHolic AI" />
        <div className="flex max-w-full flex-col items-center gap-3 md:gap-2">
          <h1
            id="certificate-title"
            className="text-2xl font-bold tracking-tight text-ink sm:text-4xl"
          >
            {t('document.heading')}
          </h1>
          <p className="text-ink-muted">{t('document.presentedTo')}</p>
          <p className="max-w-full text-3xl font-semibold break-words text-brand-800 sm:text-5xl">
            {certificate.recipientName}
          </p>
          <p className="text-ink-muted">{t('document.completed')}</p>
          <p className="max-w-full text-xl font-semibold break-words text-ink sm:text-2xl">
            {certificateTitle(certificate, locale)}
          </p>
          {certificate.isOfficial ? (
            <CertifiedBadge size="md" />
          ) : (
            certificate.schoolName && (
              <p className="text-sm text-ink-muted">
                {t('document.school', { school: certificate.schoolName })}
              </p>
            )
          )}
        </div>
        <div className="flex w-full flex-col items-center gap-4">
          <dl className="grid w-full gap-4 text-sm sm:grid-cols-3">
            <div className="min-w-0">
              <dt className="text-ink-muted">{t('document.date')}</dt>
              <dd className="font-semibold text-ink">
                {formatDate(certificate.issuedAt, 'dateLong')}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-ink-muted">{t('document.issuer')}</dt>
              <dd className="font-semibold break-words text-ink">
                {certificate.issuerName}
                {officialSchool && (
                  <span className="block font-normal text-ink-muted">{officialSchool}</span>
                )}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-ink-muted">{t('document.code')}</dt>
              <dd className="font-semibold text-ink">
                <span translate="no" className="font-mono whitespace-nowrap">
                  {certificate.verificationCode}
                </span>
              </dd>
            </div>
          </dl>
          {/* Plain text, not a link: it is printed. The toolbar copies it. */}
          <p className="max-w-full text-xs text-ink-muted">
            {t('document.verifyLabel')} <span className="break-all">{verifyUrl}</span>
          </p>
        </div>
        {revoked && (
          // Centred by a flex wrapper: no physical or start/end class.
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="-rotate-12 rounded-control border-4 border-danger bg-surface/80 px-6 py-2 text-3xl font-bold tracking-widest text-danger uppercase">
              {t('document.revoked')}
            </p>
          </div>
        )}
      </article>
    </>
  );
}
