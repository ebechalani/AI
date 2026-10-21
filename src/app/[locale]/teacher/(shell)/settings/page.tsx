import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { AccountCard } from '@/components/teacher/AccountCard';
import { LanguageForm } from '@/components/teacher/LanguageForm';
import { MyCertificates } from '@/components/teacher/MyCertificates';
import { ProfileForm } from '@/components/teacher/ProfileForm';
import { requireRole } from '@/lib/auth/session';
import { listCertificatesForUser } from '@/lib/data/certificates';
import { getUser } from '@/lib/data/users';

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('teacher');
  const tNav = await getTranslations('nav');
  return { title: tNav('teacher.settings') };
}

// The teacher's settings (ARCHITECTURE.md 6.5, 3.7 "Teacher Settings" with WS-E-1): profile,
// language, account and the Teacher Academy certificates.
export default async function TeacherSettingsPage() {
  const session = await requireRole('teacher');
  const [profile, certificates, t, tNav] = await Promise.all([
    getUser(session, session.uid),
    listCertificatesForUser(session, session.uid),
    getTranslations('teacher'),
    getTranslations('nav'),
  ]);

  return (
    <>
      <PageHeader title={tNav('teacher.settings')} description={t('settings.description')} />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <ProfileForm displayName={session.displayName} avatarId={session.avatarId} />
        <div className="flex min-w-0 flex-col gap-6">
          <LanguageForm locale={session.locale} />
          <AccountCard
            email={profile.email}
            schoolless={session.schoolId === null}
            verifiedEducator={session.verifiedEducator}
          />
        </div>
      </div>
      <MyCertificates certificates={certificates} />
    </>
  );
}
