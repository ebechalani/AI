import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { normalizeVerificationCode, VerificationResult } from '@/components/certificates';
import { PageHeader } from '@/components/layout';
import { getCertificateByCode } from '@/lib/data/certificates';
import { routing } from '@/lib/i18n/routing';

// The status of a certificate can change at any time (revoked, issued again).
export const dynamic = 'force-dynamic';

type Params = Promise<{ locale: string; code: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: t('pages.verifyCertificate'), robots: { index: false, follow: false } };
}

// Public certificate verification (ARCHITECTURE.md 6.1, 12 "Certificates"): only the redacted
// PublicCertificate reaches this page, never the learner's name, the reason or the revocation
// date. An unknown code is an answer of the page, not a 404.
export default async function VerifyCertificatePage({ params }: { params: Params }) {
  const { locale, code } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const normalized = normalizeVerificationCode(code);
  const [certificate, t, tNav] = await Promise.all([
    getCertificateByCode(normalized),
    getTranslations('certificates'),
    getTranslations('nav'),
  ]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader title={tNav('pages.verifyCertificate')} description={t('verify.description')} />
      <VerificationResult certificate={certificate} code={normalized} />
    </div>
  );
}
