import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { DashboardStats } from '@/components/school/DashboardStats';
import { GettingStarted } from '@/components/school/GettingStarted';
import { RecentCertificates } from '@/components/school/RecentCertificates';
import { SchoolStatusAlerts } from '@/components/school/SchoolStatusAlerts';
import {
  currentLicense,
  onboardingSteps,
  RECENT_CERTIFICATES,
  requireSchoolId,
  seatSummary,
} from '@/components/school/school-model';
import { SeatsCard } from '@/components/school/SeatsCard';
import { SettingsSummary } from '@/components/school/SettingsSummary';
import { requireRole } from '@/lib/auth/session';
import { getSchoolStats } from '@/lib/data/analytics';
import { listLicensesForSchool } from '@/lib/data/billing';
import { listCertificatesForSchool } from '@/lib/data/certificates';
import { getSchool } from '@/lib/data/schools';
import { getPublicEnv } from '@/lib/env';

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('school_admin');
  const tNav = await getTranslations('nav');
  return { title: tNav('school_admin.dashboard') };
}

// The school admin's home (ARCHITECTURE.md 6.6, 3.7 "School Dashboard" with WS-G-1): the school
// in numbers, what to do first, the seats, the switches and the latest certificates.
export default async function SchoolDashboardPage() {
  const session = await requireRole('school_admin');
  const schoolId = requireSchoolId(session);
  const now = new Date();
  const [school, stats, licenses, recent] = await Promise.all([
    getSchool(session, schoolId),
    getSchoolStats(session, schoolId),
    listLicensesForSchool(session, schoolId),
    listCertificatesForSchool(session, schoolId, { limit: RECENT_CERTIFICATES }),
  ]);
  const t = await getTranslations('school');
  const tNav = await getTranslations('nav');

  const seats = seatSummary(stats.seatsUsed, stats.seatsTotal);
  const current = currentLicense(licenses, now);

  return (
    <>
      <PageHeader
        title={tNav('school_admin.dashboard')}
        description={
          school.city ? t('dashboard.schoolLine', { name: school.name, city: school.city }) : school.name
        }
      />
      <SchoolStatusAlerts
        status={school.status}
        seats={seats}
        contactEmail={getPublicEnv().contactEmail}
        className="mb-6"
      />
      <DashboardStats stats={stats} />
      <GettingStarted steps={onboardingSteps(school.counts)} />
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* First in the DOM: on phones the seats and the switches come before the activity. */}
        <div className="flex min-w-0 flex-col gap-6 lg:col-start-3 lg:row-start-1">
          <SeatsCard
            title={t('dashboard.seats.title')}
            seats={seats}
            current={current}
            now={now.toISOString()}
            showLink
          />
          <SettingsSummary settings={school.settings} />
        </div>
        <div className="min-w-0 lg:col-span-2 lg:col-start-1 lg:row-start-1">
          <RecentCertificates certificates={recent.items} />
        </div>
      </div>
    </>
  );
}
