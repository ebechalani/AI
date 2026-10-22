import type { Metadata } from 'next';
import { ArrowLeft, Inbox } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { challengeTitle } from '@/components/admin/challenge-model';
import { EntriesTable } from '@/components/admin/EntriesTable';
import { ListPagination } from '@/components/admin/ListPagination';
import { pageLinks, PAGE_SIZE, parsePaging } from '@/components/admin/paging';
import {
  ADMIN_PATHS,
  adminChallengeEntriesPath,
  adminChallengePath,
  firstParam,
} from '@/components/admin/paths';
import { PageHeader } from '@/components/layout';
import { EmptyState, LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listSubmissionsForChallenge } from '@/lib/data/submissions';
import { challengeOrNotFound, pageOrFirst } from '../../../_lib/load';

type Params = Promise<{ challengeId: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  await requireRole('platform_admin');
  const { challengeId } = await params;
  const [challenge, locale, t] = await Promise.all([
    challengeOrNotFound(challengeId),
    getLocale(),
    getTranslations('admin'),
  ]);
  return {
    title: t('challenges.entries.metaTitle', {
      title: challengeTitle(challenge, locale) ?? t('challenges.untitled'),
    }),
  };
}

// The entries of a challenge, newest first, 50 per page, read-only (ARCHITECTURE.md 6.7).
export default async function AdminChallengeEntriesPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const session = await requireRole('platform_admin');
  const { challengeId } = await params;
  const raw = await searchParams;
  const challenge = await challengeOrNotFound(challengeId);
  const paging = parsePaging(firstParam(raw.cursor), firstParam(raw.trail), firstParam(raw.page));
  const [page, locale, t, tNav] = await Promise.all([
    pageOrFirst(
      () => listSubmissionsForChallenge(session, challenge.id, { limit: PAGE_SIZE, cursor: paging.cursor }),
      adminChallengeEntriesPath(challenge.id),
    ),
    getLocale(),
    getTranslations('admin'),
    getTranslations('nav'),
  ]);
  const title = challengeTitle(challenge, locale) ?? t('challenges.untitled');
  const links = pageLinks(adminChallengeEntriesPath(challenge.id), {}, paging, page.nextCursor);

  return (
    <>
      <PageHeader
        className="wrap-anywhere"
        title={t('challenges.entries.title')}
        description={t('challenges.entries.description', { title })}
        breadcrumbs={[
          { label: tNav('platform_admin.challenges'), href: ADMIN_PATHS.challenges },
          { label: title, href: adminChallengePath(challenge.id) },
          { label: t('challenges.entries.title') },
        ]}
        actions={
          <LinkButton href={adminChallengePath(challenge.id)} variant="secondary">
            <ArrowLeft aria-hidden="true" className="rtl:-scale-x-100" />
            {t('challenges.entries.back')}
          </LinkButton>
        }
      />
      {page.items.length === 0 && paging.cursor === null ? (
        <EmptyState
          icon={<Inbox />}
          titleAs="h2"
          title={t('challenges.entries.empty.title')}
          description={t('challenges.entries.empty.description')}
        />
      ) : (
        <>
          <EntriesTable entries={page.items} title={title} />
          <ListPagination {...links} />
        </>
      )}
    </>
  );
}
