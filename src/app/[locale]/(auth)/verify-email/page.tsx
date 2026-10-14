import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { VerifyEmailNotice } from '@/components/auth';
import { roleHome } from '@/lib/auth/roles';
import { getSession } from '@/lib/auth/session';
import { redirect } from '@/lib/i18n/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return { title: t('verifyEmail.title') };
}

export default async function VerifyEmailPage() {
  // A session exists only for a confirmed address: the notice is moot.
  const session = await getSession();
  if (session !== null) {
    redirect({ href: roleHome(session.role), locale: await getLocale() });
  }

  return <VerifyEmailNotice />;
}
