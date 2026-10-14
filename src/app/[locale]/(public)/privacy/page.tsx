import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalDocument } from '@/components/marketing';
import { routing } from '@/lib/i18n/routing';

// Reading order of `legal.privacy.sections`.
const SECTIONS = [
  'who',
  'data',
  'children',
  'use',
  'ai',
  'sharing',
  'retention',
  'rights',
  'security',
  'changes',
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'legal' });
  return { title: t('privacy.title') };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return <LegalDocument document="privacy" sections={SECTIONS} />;
}
