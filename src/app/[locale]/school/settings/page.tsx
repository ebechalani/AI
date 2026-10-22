import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { regionName, requireSchoolId } from '@/components/school/school-model';
import { SchoolFeaturesForm } from '@/components/school/SchoolFeaturesForm';
import { SchoolProfileForm } from '@/components/school/SchoolProfileForm';
import { SchoolStatusAlerts } from '@/components/school/SchoolStatusAlerts';
import { requireRole } from '@/lib/auth/session';
import { getSchool } from '@/lib/data/schools';
import { getPublicEnv } from '@/lib/env';

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('school_admin');
  const tNav = await getTranslations('nav');
  return { title: tNav('school_admin.settings') };
}

// The school's profile and switches (ARCHITECTURE.md 6.6, 3.7 "School Settings"). The two forms
// keep their own state from the props: no `key` remount on a save, so an unsaved edit in one form
// survives a save in the other and the focus stays on the pressed button.
export default async function SchoolSettingsPage() {
  const session = await requireRole('school_admin');
  const schoolId = requireSchoolId(session);
  const [school, locale] = await Promise.all([getSchool(session, schoolId), getLocale()]);
  const t = await getTranslations('school');
  const tNav = await getTranslations('nav');

  return (
    <>
      <PageHeader title={tNav('school_admin.settings')} description={t('settings.description')} />
      <SchoolStatusAlerts
        status={school.status}
        seats={null}
        contactEmail={getPublicEnv().contactEmail}
        className="mb-6"
      />
      <div className="flex max-w-3xl flex-col gap-8">
        <SchoolProfileForm school={school} countryName={regionName(school.country, locale)} />
        <SchoolFeaturesForm settings={school.settings} />
      </div>
    </>
  );
}
