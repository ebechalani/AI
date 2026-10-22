import type { Metadata } from 'next';
import { KeyRound } from 'lucide-react';
import { getLocale, getTimeZone, getTranslations } from 'next-intl/server';
import {
  courseChoices,
  courseTitleIndex,
  pathwayChoices,
  pathwayTitleIndex,
} from '@/components/admin/billing-model';
import { EditSchoolButton } from '@/components/admin/EditSchoolButton';
import { LicenseButton } from '@/components/admin/LicenseButton';
import { LicensesTable } from '@/components/admin/LicensesTable';
import { LinkTabs } from '@/components/admin/LinkTabs';
import { ListPagination } from '@/components/admin/ListPagination';
import { listHref, pageLinks, PAGE_SIZE, parsePaging } from '@/components/admin/paging';
import { ADMIN_PATHS, adminSchoolPath, firstParam } from '@/components/admin/paths';
import { schoolChoices, schoolNameIndex, seatSummary } from '@/components/admin/school-model';
import { SchoolOverview } from '@/components/admin/SchoolOverview';
import { SchoolStatusButton } from '@/components/admin/SchoolStatusButton';
import { SubscriptionButton } from '@/components/admin/SubscriptionButton';
import { SubscriptionsTable } from '@/components/admin/SubscriptionsTable';
import { DEFAULT_PEOPLE_ROLE, parseRole, PEOPLE_TABS } from '@/components/admin/user-model';
import { UsersTable } from '@/components/admin/UsersTable';
import { PageHeader } from '@/components/layout';
import { Alert, EmptyState } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listLicensesForSchool, listSubscriptionsForOwner } from '@/lib/data/billing';
import { listOfficialCourses } from '@/lib/data/courses';
import { listPathways } from '@/lib/data/pathways';
import { listSchoolUsers } from '@/lib/data/users';
import { formatDate } from '@/lib/utils';
import { listAllSchools, pageOrFirst, schoolOrNotFound } from '../../_lib/load';

type Params = Promise<{ schoolId: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  await requireRole('platform_admin');
  const { schoolId } = await params;
  const school = await schoolOrNotFound(schoolId);
  return { title: school.name };
}

// One school (ARCHITECTURE.md 6.7): its facts and numbers, its licences and subscriptions, and
// its people by role, with the edit, suspend / reactivate and creation dialogs.
export default async function AdminSchoolPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const session = await requireRole('platform_admin');
  const { schoolId } = await params;
  const raw = await searchParams;
  const school = await schoolOrNotFound(schoolId);
  const people = parseRole(firstParam(raw.people), PEOPLE_TABS, DEFAULT_PEOPLE_ROLE);
  const paging = parsePaging(firstParam(raw.cursor), firstParam(raw.trail), firstParam(raw.page));
  const now = new Date().toISOString();
  const [licenses, subscriptions, peoplePage, pathways, courses, schools, locale, timeZone, t, tNav, tDomain] =
    await Promise.all([
      listLicensesForSchool(session, school.id),
      listSubscriptionsForOwner(session, 'school', school.id),
      pageOrFirst(
        () => listSchoolUsers(session, school.id, people, { limit: PAGE_SIZE, cursor: paging.cursor }),
        listHref(adminSchoolPath(school.id), { people }),
      ),
      listPathways(session),
      listOfficialCourses(session),
      listAllSchools(),
      getLocale(),
      getTimeZone(),
      getTranslations('admin'),
      getTranslations('nav'),
      getTranslations('domain'),
    ]);

  const seats = seatSummary(school.counts.students, licenses, now);
  const namedCourses = subscriptions.flatMap((subscription) => subscription.courseIds);
  const subscriptionOptions = subscriptions.map((subscription) => ({
    value: subscription.id,
    label: t('billing.licenseForm.subscriptionOption', {
      plan: t(`billing.plans.${subscription.plan}`),
      start: formatDate(subscription.currentPeriodStart, locale, 'date', timeZone),
      end: formatDate(subscription.currentPeriodEnd, locale, 'date', timeZone),
    }),
  }));
  const owner = { kind: 'fixed', ownerType: 'school', ownerId: school.id, name: school.name } as const;
  const peopleLinks = pageLinks(adminSchoolPath(school.id), { people }, paging, peoplePage.nextCursor);
  const sectionTitle = 'text-xl font-semibold text-ink';

  return (
    <>
      <PageHeader
        className="wrap-anywhere"
        title={school.name}
        breadcrumbs={[
          { label: tNav('platform_admin.schools'), href: ADMIN_PATHS.schools },
          { label: school.name },
        ]}
        actions={
          <>
            <EditSchoolButton school={school} />
            <SchoolStatusButton schoolId={school.id} name={school.name} status={school.status} />
          </>
        }
      />
      <div className="flex flex-col gap-8">
        {school.status === 'suspended' && (
          <Alert tone="warning" live="off" title={t('schools.detail.suspendedAlert.title')}>
            {t('schools.detail.suspendedAlert.description')}
          </Alert>
        )}
        <SchoolOverview school={school} seats={seats} />

        <section aria-labelledby="licenses-title" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
              <h2 id="licenses-title" tabIndex={-1} className={`rounded-sm ${sectionTitle}`}>
                {t('schools.detail.licenses.title')}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">{t('schools.detail.licenses.description')}</p>
            </div>
            <LicenseButton
              mode="create"
              schoolId={school.id}
              schools={[]}
              pathways={pathwayChoices(pathways, locale)}
              subscriptionOptions={subscriptionOptions}
            />
          </div>
          {licenses.length === 0 ? (
            <EmptyState
              variant="plain"
              icon={<KeyRound />}
              titleAs="h3"
              title={t('schools.detail.licenses.empty.title')}
              description={t('schools.detail.licenses.empty.description')}
            />
          ) : (
            <LicensesTable
              licenses={licenses}
              schoolNames={{ [school.id]: school.name }}
              pathwayTitles={pathwayTitleIndex(pathways, locale)}
              showSchool={false}
              now={now}
              pathways={pathwayChoices(pathways, locale)}
              subscriptionOptions={subscriptionOptions}
            />
          )}
        </section>

        <section aria-labelledby="subscriptions-title" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
              <h2 id="subscriptions-title" className={sectionTitle}>
                {t('schools.detail.subscriptions.title')}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                {t('schools.detail.subscriptions.description')}
              </p>
            </div>
            <SubscriptionButton
              mode="create"
              owner={owner}
              ownerLabel={school.name}
              courses={courseChoices(courses, namedCourses, locale)}
              schools={[]}
            />
          </div>
          {subscriptions.length === 0 ? (
            <EmptyState
              variant="plain"
              titleAs="h3"
              title={t('schools.detail.subscriptions.empty.title')}
              description={t('schools.detail.subscriptions.empty.description')}
            />
          ) : (
            <SubscriptionsTable
              subscriptions={subscriptions}
              ownerNames={{ [school.id]: school.name }}
              courseTitles={courseTitleIndex(courses, locale)}
              courses={courseChoices(courses, namedCourses, locale)}
              showOwner={false}
              now={now}
            />
          )}
        </section>

        <section aria-labelledby="people-title" className="flex flex-col gap-4">
          <h2 id="people-title" tabIndex={-1} className={`rounded-sm ${sectionTitle}`}>
            {t('schools.detail.people.title')}
          </h2>
          <LinkTabs
            label={t('schools.detail.people.tabsLabel')}
            items={PEOPLE_TABS.map((role) => ({
              key: role,
              label: tDomain(`roles.${role}`),
              href: listHref(adminSchoolPath(school.id), { people: role }),
              active: role === people,
            }))}
          />
          {peoplePage.items.length === 0 && paging.cursor === null ? (
            <EmptyState
              variant="plain"
              titleAs="h3"
              title={t(`schools.detail.people.empty.${people}`)}
            />
          ) : (
            <UsersTable
              users={peoplePage.items}
              role={people}
              viewerUid={session.uid}
              schools={schoolChoices(schools, locale)}
              schoolNames={schoolNameIndex(schools)}
              showSchool={false}
              caption={t('schools.detail.people.caption', {
                role: tDomain(`roles.${people}`),
                school: school.name,
              })}
              focusAfterRemovalId="people-title"
            />
          )}
          {people === 'school_admin' && (
            <p className="text-sm text-ink-muted">{t('schools.detail.people.adminHint')}</p>
          )}
          <ListPagination {...peopleLinks} />
        </section>
      </div>
    </>
  );
}
