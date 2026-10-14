import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { EmptyState } from '@/components/ui';
import { routing } from '@/lib/i18n/routing';

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('nav');

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title={t('pages.verifyCertificate')} />
      <EmptyState />
    </div>
  );
}
