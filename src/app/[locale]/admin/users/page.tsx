import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { MAIN_CONTENT_ID } from '@/components/admin/ids';
import { LinkTabs } from '@/components/admin/LinkTabs';
import { ListPagination } from '@/components/admin/ListPagination';
import { pageLinks, PAGE_SIZE, parsePaging } from '@/components/admin/paging';
import { ADMIN_PATHS, firstParam, usersPath } from '@/components/admin/paths';
import { schoolChoices, schoolNameIndex } from '@/components/admin/school-model';
import { DEFAULT_ROLE, parseRole, ROLE_TABS } from '@/components/admin/user-model';
import { UsersTable } from '@/components/admin/UsersTable';
import { PageHeader } from '@/components/layout';
import { EmptyState } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listUsersByRole } from '@/lib/data/users';
import { listAllSchools, pageOrFirst } from '../_lib/load';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('platform_admin');
  const tNav = await getTranslations('nav');
  return { title: tNav('platform_admin.users') };
}

// Every account by role, newest first, 50 per page (ARCHITECTURE.md 6.7, 3.7 "Admin lists"),
// with the role, status and educator controls on every row but the admin's own.
export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireRole('platform_admin');
  const raw = await searchParams;
  const role = parseRole(firstParam(raw.role), ROLE_TABS, DEFAULT_ROLE);
  const paging = parsePaging(firstParam(raw.cursor), firstParam(raw.trail), firstParam(raw.page));
  const [page, schools, locale, t, tNav, tDomain] = await Promise.all([
    pageOrFirst(
      () => listUsersByRole(session, role, { limit: PAGE_SIZE, cursor: paging.cursor }),
      usersPath(role),
    ),
    listAllSchools(),
    getLocale(),
    getTranslations('admin'),
    getTranslations('nav'),
    getTranslations('domain'),
  ]);
  const links = pageLinks(ADMIN_PATHS.users, { role }, paging, page.nextCursor);

  return (
    <>
      <PageHeader title={tNav('platform_admin.users')} description={t('users.description')} />
      <LinkTabs
        className="mb-6"
        label={t('users.tabsLabel')}
        items={ROLE_TABS.map((tab) => ({
          key: tab,
          label: tDomain(`roles.${tab}`),
          href: usersPath(tab),
          active: tab === role,
        }))}
      />
      {page.items.length === 0 && paging.cursor === null ? (
        <EmptyState
          icon={<Users />}
          titleAs="h2"
          title={t(`users.empty.${role}`)}
          description={t('users.emptyDescription')}
        />
      ) : (
        <>
          <UsersTable
            users={page.items}
            role={role}
            viewerUid={session.uid}
            schools={schoolChoices(schools, locale)}
            schoolNames={schoolNameIndex(schools)}
            showSchool
            caption={t('users.caption', { role: tDomain(`roles.${role}`) })}
            focusAfterRemovalId={MAIN_CONTENT_ID}
          />
          <ListPagination {...links} />
        </>
      )}
    </>
  );
}
