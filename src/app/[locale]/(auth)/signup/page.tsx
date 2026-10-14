import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { SignupForm, type SignupRole } from '@/components/auth';
import { roleHome } from '@/lib/auth/roles';
import { getSession } from '@/lib/auth/session';
import { redirect } from '@/lib/i18n/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return { title: t('signup.title') };
}

// The homepage entrances preselect the role; anything else starts as a student.
function initialRole(role: string | string[] | undefined): SignupRole {
  return role === 'teacher' ? 'teacher' : 'student';
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { role } = await searchParams;

  const session = await getSession();
  if (session !== null) {
    redirect({ href: roleHome(session.role), locale: await getLocale() });
  }

  return <SignupForm initialRole={initialRole(role)} />;
}
