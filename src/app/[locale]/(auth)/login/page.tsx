import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { LoginForm } from '@/components/auth';
import { safeNextPath } from '@/lib/auth/roles';
import { getSession } from '@/lib/auth/session';
import { redirect } from '@/lib/i18n/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return { title: t('login.title') };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { next } = await searchParams;
  const nextPath = typeof next === 'string' ? next : null;

  // A signed-in visitor has nothing to do here; `next` is honoured only inside their area.
  const session = await getSession();
  if (session !== null) {
    redirect({ href: safeNextPath(nextPath, session.role), locale: await getLocale() });
  }

  return <LoginForm next={nextPath} />;
}
