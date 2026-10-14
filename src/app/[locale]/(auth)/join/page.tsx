import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { AuthHeading, JoinSignupForm } from '@/components/auth';
import { JoinClassForm } from '@/components/classes/JoinClassForm';
import { Alert, LinkButton } from '@/components/ui';
import { roleHome } from '@/lib/auth/roles';
import { getSession } from '@/lib/auth/session';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return { title: t('join.title') };
}

/**
 * Three visitors, three branches (ARCHITECTURE.md 6.2): not signed in, a username account is
 * created in the class; a student joins the class with the shared JoinClassForm; any other
 * role manages classes from their own space.
 */
export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { code } = await searchParams;
  const session = await getSession();

  if (session === null) {
    return <JoinSignupForm initialCode={typeof code === 'string' ? code : null} />;
  }

  const t = await getTranslations('auth');
  if (session.role === 'student') {
    return (
      <div className="flex flex-col gap-6">
        <AuthHeading
          icon={<Users />}
          title={t('join.signedIn.title')}
          description={t('join.signedIn.description')}
        />
        <JoinClassForm redirectTo={roleHome('student')} />
      </div>
    );
  }

  const tDomain = await getTranslations('domain');
  return (
    <div className="flex flex-col gap-6">
      <AuthHeading icon={<Users />} title={t('join.title')} />
      <Alert tone="info" title={t('join.wrongRole.title')} live="off">
        {t('join.wrongRole.description', { role: tDomain(`roles.${session.role}`) })}
      </Alert>
      <LinkButton href={roleHome(session.role)} size="lg" fullWidth>
        {t('join.wrongRole.mySpace')}
      </LinkButton>
    </div>
  );
}
