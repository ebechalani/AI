import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalDocument } from '@/components/marketing';
import { routing } from '@/lib/i18n/routing';

// Reading order of `legal.terms.sections`.
const SECTIONS = [
  'acceptance',
  'accounts',
  'schools',
  'conduct',
  'content',
  'ai',
  'payments',
  'termination',
  'liability',
  'changes',
  'law',
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'legal' });
  return { title: t('terms.title') };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return <LegalDocument document="terms" sections={SECTIONS} />;
}
