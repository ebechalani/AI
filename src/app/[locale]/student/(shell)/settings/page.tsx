import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { JoinClassForm } from '@/components/classes/JoinClassForm';
import { PageHeader } from '@/components/layout';
import { requireRole } from '@/lib/auth/session';
import { getUser } from '@/lib/data/users';
import { AccountFacts } from './_components/AccountFacts';
import { LanguageForm } from './_components/LanguageForm';
import { ProfileForm } from './_components/ProfileForm';
import { SettingsSection } from './_components/SettingsSection';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('student.settings') };
}

// Settings (ARCHITECTURE.md 6.4, 3.7 "Student Settings"): name and avatar, language, joining a
// class, and the sign-in details, all from the student's own profile.
export default async function StudentSettingsPage() {
  const session = await requireRole('student');
  const [profile, t, tNav] = await Promise.all([
    getUser(session, session.uid),
    getTranslations('settings'),
    getTranslations('nav'),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader title={tNav('student.settings')} description={t('description')} />
      <div className="flex flex-col gap-6">
        <SettingsSection
          id="settings-profile"
          title={t('profile.title')}
          description={t('profile.description')}
        >
          <ProfileForm displayName={profile.displayName} avatarId={profile.avatarId} />
        </SettingsSection>
        <SettingsSection
          id="settings-language"
          title={t('language.title')}
          description={t('language.description')}
        >
          <LanguageForm current={profile.locale} />
        </SettingsSection>
        <SettingsSection
          id="settings-classes"
          title={t('classes.title')}
          description={t('classes.description')}
        >
          <p className="text-sm font-medium text-ink">
            {t('classes.count', { count: profile.classIds.length })}
          </p>
          <JoinClassForm redirectTo="/student/learn" />
        </SettingsSection>
        <SettingsSection id="settings-account" title={t('account.title')}>
          <AccountFacts
            username={profile.username}
            email={profile.email}
            ageBand={profile.ageBand}
          />
        </SettingsSection>
      </div>
    </div>
  );
}
