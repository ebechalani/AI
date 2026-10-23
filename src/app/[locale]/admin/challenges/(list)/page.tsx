import type { Metadata } from 'next';
import { Plus, Trophy } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import {
  filterChallenges,
  parseStatusFilter,
  STATUS_FILTERS,
} from '@/components/admin/challenge-model';
import { ChallengesTable } from '@/components/admin/ChallengesTable';
import { LinkTabs } from '@/components/admin/LinkTabs';
import { listHref } from '@/components/admin/paging';
import { ADMIN_PATHS, firstParam } from '@/components/admin/paths';
import { schoolNameIndex } from '@/components/admin/school-model';
import { PageHeader } from '@/components/layout';
import { EmptyState, LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listAllChallenges } from '@/lib/data/challenges';
import { listAllSchools } from '../../_lib/load';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('platform_admin');
  const tNav = await getTranslations('nav');
  return { title: tNav('platform_admin.challenges') };
}

// Every challenge, latest deadline first (ARCHITECTURE.md 6.7), filtered by status, with the
// publish / draft / archive / restore buttons on each row. In the `(list)` group, so the editor
// and the entries show their own skeletons.
export default async function AdminChallengesPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireRole('platform_admin');
  const raw = await searchParams;
  const filter = parseStatusFilter(firstParam(raw.status));
  const now = new Date().toISOString();
  const [challenges, schools, t, tNav] = await Promise.all([
    listAllChallenges(session),
    listAllSchools(),
    getTranslations('admin'),
    getTranslations('nav'),
  ]);
  const shown = filterChallenges(challenges, filter);
  const newButton = (
    <LinkButton href={ADMIN_PATHS.newChallenge}>
      <Plus aria-hidden="true" />
      {t('challenges.new')}
    </LinkButton>
  );

  return (
    <>
      <PageHeader
        title={tNav('platform_admin.challenges')}
        description={t('challenges.description')}
        actions={challenges.length > 0 ? newButton : undefined}
      />
      {challenges.length === 0 ? (
        <EmptyState
          icon={<Trophy />}
          titleAs="h2"
          title={t('challenges.empty.title')}
          description={t('challenges.empty.description')}
          action={newButton}
        />
      ) : (
        <>
          <LinkTabs
            className="mb-6"
            label={t('challenges.filterLabel')}
            items={STATUS_FILTERS.map((status) => ({
              key: status,
              label: t(`challenges.filters.${status}`),
              href: listHref(ADMIN_PATHS.challenges, { status: status === 'all' ? null : status }),
              active: status === filter,
            }))}
          />
          {shown.length === 0 ? (
            <EmptyState
              titleAs="h2"
              title={t('challenges.emptyFilter.title')}
              description={t('challenges.emptyFilter.description')}
              action={
                <LinkButton href={ADMIN_PATHS.challenges} variant="secondary">
                  {t('challenges.filters.all')}
                </LinkButton>
              }
            />
          ) : (
            <ChallengesTable
              challenges={shown}
              schoolNames={schoolNameIndex(schools)}
              now={now}
              filter={filter}
            />
          )}
        </>
      )}
    </>
  );
}
