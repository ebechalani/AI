import type { Metadata } from 'next';
import { Building2 } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { CreateSchoolButton } from '@/components/admin/CreateSchoolButton';
import { ListPagination } from '@/components/admin/ListPagination';
import { pageLinks, PAGE_SIZE, parsePaging } from '@/components/admin/paging';
import { ADMIN_PATHS, firstParam } from '@/components/admin/paths';
import { SchoolsTable } from '@/components/admin/SchoolsTable';
import { PageHeader } from '@/components/layout';
import { EmptyState } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listSchools } from '@/lib/data/schools';
import { pageOrFirst } from '../../_lib/load';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('platform_admin');
  const tNav = await getTranslations('nav');
  return { title: tNav('platform_admin.schools') };
}

// Every school by name, 50 per page (ARCHITECTURE.md 6.7, 3.7 "Admin lists"), with the
// creation dialog. In the `(list)` group, so a school's page shows its own skeleton.
export default async function AdminSchoolsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireRole('platform_admin');
  const raw = await searchParams;
  const paging = parsePaging(firstParam(raw.cursor), firstParam(raw.trail), firstParam(raw.page));
  const [page, t, tNav] = await Promise.all([
    pageOrFirst(
      () => listSchools(session, { limit: PAGE_SIZE, cursor: paging.cursor }),
      ADMIN_PATHS.schools,
    ),
    getTranslations('admin'),
    getTranslations('nav'),
  ]);
  const empty = page.items.length === 0 && paging.cursor === null;
  const links = pageLinks(ADMIN_PATHS.schools, {}, paging, page.nextCursor);

  return (
    <>
      <PageHeader
        title={tNav('platform_admin.schools')}
        description={t('schools.description')}
        // One trigger only: the dialog's owner must not move when the first school appears.
        actions={empty ? undefined : <CreateSchoolButton />}
      />
      {empty ? (
        <EmptyState
          icon={<Building2 />}
          titleAs="h2"
          title={t('schools.empty.title')}
          description={t('schools.empty.description')}
          action={<CreateSchoolButton size="lg" />}
        />
      ) : (
        <>
          <SchoolsTable schools={page.items} />
          <ListPagination {...links} />
        </>
      )}
    </>
  );
}
