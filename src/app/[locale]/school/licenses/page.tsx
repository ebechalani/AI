import type { Metadata } from 'next';
import { KeyRound } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { LicenseList } from '@/components/school/LicenseList';
import {
  currentLicense,
  requireSchoolId,
  seatSummaryFromLicenses,
} from '@/components/school/school-model';
import { SchoolStatusAlerts } from '@/components/school/SchoolStatusAlerts';
import { SeatsCard } from '@/components/school/SeatsCard';
import { EmptyState, LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listLicensesForSchool } from '@/lib/data/billing';
import { listPublishedPathways } from '@/lib/data/pathways';
import { getSchool } from '@/lib/data/schools';
import { getPublicEnv } from '@/lib/env';
import { pickTranslation } from '@/lib/i18n/content';

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('school_admin');
  const tNav = await getTranslations('nav');
  return { title: tNav('school_admin.licenses') };
}

// The school's licences and seats (ARCHITECTURE.md 6.6, 4.5, 3.7 "School Licenses" with WS-G-1).
// Read-only: platform admins manage licences (4.2). The seats follow the rule of
// `getSchoolStats` (`seatSummaryFromLicenses`), so this page and the dashboard agree.
export default async function SchoolLicensesPage() {
  const session = await requireRole('school_admin');
  const schoolId = requireSchoolId(session);
  const now = new Date();
  const [school, licenses, locale] = await Promise.all([
    getSchool(session, schoolId),
    listLicensesForSchool(session, schoolId),
    getLocale(),
  ]);
  // The pathway titles are read only when a licence names pathways (a read 3.7 lists on its own).
  const pathways = licenses.some((license) => license.scope.type === 'pathways')
    ? await listPublishedPathways()
    : [];
  const t = await getTranslations('school');
  const tNav = await getTranslations('nav');

  const pathwayTitles = Object.fromEntries(
    pathways.map((pathway) => [
      pathway.id,
      pickTranslation(pathway.translations, locale, pathway.defaultLocale).title,
    ]),
  );
  const seats = seatSummaryFromLicenses(school.counts.students, licenses, now);
  const current = currentLicense(licenses, now);
  const contactEmail = getPublicEnv().contactEmail;

  return (
    <>
      <PageHeader title={tNav('school_admin.licenses')} description={t('licenses.description')} />
      <SchoolStatusAlerts
        status={school.status}
        seats={seats}
        contactEmail={contactEmail}
        className="mb-6"
      />
      <div className="flex flex-col gap-8">
        <div className="max-w-xl">
          <SeatsCard
            title={t('licenses.seats.title')}
            seats={seats}
            current={current}
            now={now.toISOString()}
            showLink={false}
            explain={t('licenses.seats.explain')}
          />
        </div>
        <section aria-labelledby="licenses-list-title" className="flex min-w-0 flex-col gap-4">
          <h2 id="licenses-list-title" className="text-xl font-bold text-ink">
            {t('licenses.listTitle')}
          </h2>
          {licenses.length === 0 ? (
            <EmptyState
              icon={<KeyRound />}
              title={t('licenses.empty.title')}
              description={t('licenses.empty.description')}
            />
          ) : (
            <LicenseList licenses={licenses} pathwayTitles={pathwayTitles} now={now.toISOString()} />
          )}
        </section>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-ink-muted">{t('licenses.contactText')}</p>
          {contactEmail !== null && (
            <LinkButton href={`mailto:${contactEmail}`} variant="secondary" size="sm">
              {t('alerts.contact')}
            </LinkButton>
          )}
        </div>
      </div>
    </>
  );
}
