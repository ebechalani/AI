import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { CreditCard, KeyRound } from 'lucide-react';
import { getLocale, getTimeZone, getTranslations } from 'next-intl/server';
import {
  courseChoices,
  courseTitleIndex,
  pathwayChoices,
  pathwayTitleIndex,
  type OwnerChoice,
  type SubscriptionOption,
} from '@/components/admin/billing-model';
import { LicenseButton } from '@/components/admin/LicenseButton';
import { LicensesTable } from '@/components/admin/LicensesTable';
import { LinkTabs } from '@/components/admin/LinkTabs';
import { ListPagination } from '@/components/admin/ListPagination';
import { OwnerFilterBanner } from '@/components/admin/OwnerFilterBanner';
import { listHref, pageLinks, PAGE_SIZE, parsePaging, type Paging } from '@/components/admin/paging';
import { ADMIN_PATHS, firstParam, idParam, type BillingTab } from '@/components/admin/paths';
import { schoolChoices, schoolNameIndex, type SchoolChoice } from '@/components/admin/school-model';
import { SubscriptionButton } from '@/components/admin/SubscriptionButton';
import { SubscriptionsTable } from '@/components/admin/SubscriptionsTable';
import { hasLearnerLinks } from '@/components/admin/user-model';
import { PageHeader } from '@/components/layout';
import { EmptyState } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import {
  listAllLicenses,
  listLicensesForSchool,
  listSubscriptions,
  listSubscriptionsForOwner,
} from '@/lib/data/billing';
import { listOfficialCourses } from '@/lib/data/courses';
import { listPathways } from '@/lib/data/pathways';
import { formatDate } from '@/lib/utils';
import type { License, Subscription } from '@/types/billing';
import type { Session } from '@/types/user';
import { listAllSchools, pageOrFirst, schoolOrNotFound, userNames, userOrNotFound } from '../_lib/load';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('platform_admin');
  const tNav = await getTranslations('nav');
  return { title: tNav('platform_admin.subscriptions') };
}

/** What both tabs share: the viewer, the clock, the school list and the formatting context. */
interface Shared {
  session: Session;
  now: string;
  paging: Paging;
  schoolId: string | undefined;
  schools: SchoolChoice[];
  schoolNames: Record<string, string>;
  locale: string;
  timeZone: string;
  t: Awaited<ReturnType<typeof getTranslations<'admin'>>>;
}

// Subscriptions and licences, entered by hand (ARCHITECTURE.md 6.7, 3.7 "School
// subscriptions"): two tabs, each the whole platform's list (50 per page) or one owner's.
export default async function AdminSubscriptionsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireRole('platform_admin');
  const raw = await searchParams;
  const tab: BillingTab = firstParam(raw.tab) === 'licenses' ? 'licenses' : 'subscriptions';
  const userId = tab === 'subscriptions' ? idParam(firstParam(raw.user)) : undefined;
  const schoolId = userId !== undefined ? undefined : idParam(firstParam(raw.school));
  const paging = parsePaging(firstParam(raw.cursor), firstParam(raw.trail), firstParam(raw.page));
  const now = new Date().toISOString();
  const [allSchools, locale, timeZone, t, tNav] = await Promise.all([
    listAllSchools(),
    getLocale(),
    getTimeZone(),
    getTranslations('admin'),
    getTranslations('nav'),
  ]);
  const shared: Shared = {
    session,
    now,
    paging,
    schoolId,
    schools: schoolChoices(allSchools, locale),
    schoolNames: schoolNameIndex(allSchools),
    locale,
    timeZone,
    t,
  };
  const tabs = (
    <LinkTabs
      className="mb-6"
      label={t('billing.tabsLabel')}
      items={(['subscriptions', 'licenses'] as const).map((key) => ({
        key,
        label: t(`billing.tabs.${key}`),
        // Switching tabs keeps a school filter, drops a user filter and the paging.
        href: listHref(ADMIN_PATHS.subscriptions, { tab: key === 'licenses' ? key : null, school: schoolId }),
        active: key === tab,
      }))}
    />
  );
  const { header, body } =
    tab === 'subscriptions' ? await subscriptionsTab(shared, userId) : await licensesTab(shared);

  return (
    <>
      <PageHeader
        title={tNav('platform_admin.subscriptions')}
        description={t('billing.description')}
        actions={header}
      />
      {tabs}
      {body}
    </>
  );
}

interface TabOutput {
  /** The header's create button, if any. */
  header: ReactNode;
  body: ReactNode;
}

/** The Subscriptions tab: one person's, one school's, or every subscription paged. */
async function subscriptionsTab(shared: Shared, userId: string | undefined): Promise<TabOutput> {
  const { session, now, paging, schoolId, schools, schoolNames, locale, t } = shared;
  const courses = await listOfficialCourses(session);
  let subscriptions: Subscription[];
  let ownerNames: Record<string, string | null>;
  let banner: ReactNode = null;
  let owner: OwnerChoice | null;
  let ownerLabel = '';
  let links: ReturnType<typeof pageLinks> | null = null;
  let note: string | null = null;

  if (userId !== undefined) {
    const user = await userOrNotFound(userId);
    subscriptions = await listSubscriptionsForOwner(session, 'user', user.id);
    ownerNames = { [user.id]: user.displayName };
    banner = (
      <OwnerFilterBanner
        message={t('billing.filter.user', { name: user.displayName })}
        clearHref={ADMIN_PATHS.subscriptions}
      />
    );
    const learner = hasLearnerLinks(user.role);
    owner = learner
      ? { kind: 'fixed', ownerType: 'user', ownerId: user.id, name: user.displayName }
      : null;
    ownerLabel = user.displayName;
    note = learner ? null : t('billing.filter.notLearner', { name: user.displayName });
  } else if (schoolId !== undefined) {
    const school = await schoolOrNotFound(schoolId);
    subscriptions = await listSubscriptionsForOwner(session, 'school', school.id);
    ownerNames = { [school.id]: school.name };
    banner = (
      <OwnerFilterBanner
        message={t('billing.filter.school', { tab: 'subscriptions', name: school.name })}
        clearHref={ADMIN_PATHS.subscriptions}
      />
    );
    owner = { kind: 'fixed', ownerType: 'school', ownerId: school.id, name: school.name };
    ownerLabel = school.name;
  } else {
    const page = await pageOrFirst(
      () => listSubscriptions(session, { limit: PAGE_SIZE, cursor: paging.cursor }),
      ADMIN_PATHS.subscriptions,
    );
    subscriptions = page.items;
    const users = await userNames(
      session,
      subscriptions.filter((s) => s.ownerType === 'user').map((s) => s.ownerId),
    );
    ownerNames = { ...users };
    for (const subscription of subscriptions) {
      if (subscription.ownerType === 'school') {
        ownerNames[subscription.ownerId] = schoolNames[subscription.ownerId] ?? null;
      }
    }
    owner = { kind: 'school' };
    links = pageLinks(ADMIN_PATHS.subscriptions, {}, paging, page.nextCursor);
  }

  const named = subscriptions.flatMap((subscription) => subscription.courseIds);
  const choices = courseChoices(courses, named, locale);
  const filtered = userId !== undefined || schoolId !== undefined;
  return {
    header:
      owner === null ? null : (
        <SubscriptionButton
          mode="create"
          owner={owner}
          ownerLabel={ownerLabel}
          courses={choices}
          schools={owner.kind === 'school' ? schools : []}
        />
      ),
    body: (
      <>
        {banner}
        {/* The filtered views do not page, so a stray cursor never hides their empty state. A
            staff account cannot hold a subscription: its empty state says so instead of
            inviting the admin to add one (the page offers no create button for it). */}
        {subscriptions.length === 0 && (filtered || paging.cursor === null) ? (
          <EmptyState
            icon={<CreditCard />}
            titleAs="h2"
            title={t('billing.subscriptions.empty.title')}
            description={note ?? t('billing.subscriptions.empty.description')}
          />
        ) : (
          <>
            {note !== null && <p className="mb-6 text-sm text-ink-muted">{note}</p>}
            <SubscriptionsTable
              subscriptions={subscriptions}
              ownerNames={ownerNames}
              courseTitles={courseTitleIndex(courses, locale)}
              courses={choices}
              showOwner={!filtered}
              now={now}
            />
            {links !== null && <ListPagination {...links} />}
          </>
        )}
      </>
    ),
  };
}

/** The Licenses tab: one school's licences (with its subscriptions to link), or every licence paged. */
async function licensesTab(shared: Shared): Promise<TabOutput> {
  const { session, now, paging, schoolId, schools, schoolNames, locale, timeZone, t } = shared;
  const pathways = await listPathways(session);
  const licensesHref = listHref(ADMIN_PATHS.subscriptions, { tab: 'licenses' });
  let licenses: License[];
  let banner: ReactNode = null;
  let subscriptionOptions: SubscriptionOption[] | null = null;
  let links: ReturnType<typeof pageLinks> | null = null;

  if (schoolId !== undefined) {
    const school = await schoolOrNotFound(schoolId);
    const [own, subscriptions] = await Promise.all([
      listLicensesForSchool(session, school.id),
      listSubscriptionsForOwner(session, 'school', school.id),
    ]);
    licenses = own;
    subscriptionOptions = subscriptions.map((subscription) => ({
      value: subscription.id,
      label: t('billing.licenseForm.subscriptionOption', {
        plan: t(`billing.plans.${subscription.plan}`),
        start: formatDate(subscription.currentPeriodStart, locale, 'date', timeZone),
        end: formatDate(subscription.currentPeriodEnd, locale, 'date', timeZone),
      }),
    }));
    banner = (
      <OwnerFilterBanner
        message={t('billing.filter.school', { tab: 'licenses', name: school.name })}
        // Clearing the filter keeps the tab.
        clearHref={licensesHref}
      />
    );
  } else {
    const page = await pageOrFirst(
      () => listAllLicenses(session, { limit: PAGE_SIZE, cursor: paging.cursor }),
      licensesHref,
    );
    licenses = page.items;
    links = pageLinks(ADMIN_PATHS.subscriptions, { tab: 'licenses' }, paging, page.nextCursor);
  }

  const choices = pathwayChoices(pathways, locale);
  return {
    header: (
      <LicenseButton
        mode="create"
        schoolId={schoolId ?? null}
        schools={schoolId === undefined ? schools : []}
        pathways={choices}
        subscriptionOptions={subscriptionOptions}
      />
    ),
    body: (
      <>
        {banner}
        {licenses.length === 0 && (schoolId !== undefined || paging.cursor === null) ? (
          <EmptyState
            icon={<KeyRound />}
            titleAs="h2"
            title={t('billing.licenses.empty.title')}
            description={t('billing.licenses.empty.description')}
          />
        ) : (
          <>
            <LicensesTable
              licenses={licenses}
              schoolNames={schoolNames}
              pathwayTitles={pathwayTitleIndex(pathways, locale)}
              showSchool={schoolId === undefined}
              now={now}
              pathways={choices}
              subscriptionOptions={subscriptionOptions}
            />
            {links !== null && <ListPagination {...links} />}
          </>
        )}
      </>
    ),
  };
}
