import type { Metadata } from 'next';
import { School } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { allViewHref, parseReviewListParams } from '@/components/projects/projects-model';
import { EmptyState, LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listClassesForTeacher } from '@/lib/data/classes';
import { listReviewQueue, listSubmissionsForClass } from '@/lib/data/submissions';
import { isAppError } from '@/lib/errors';
import type { Page, Submission } from '@/types';
import { ClassSubmissions } from './_components/ClassSubmissions';
import { ReviewQueue } from './_components/ReviewQueue';
import { ViewSwitch } from './_components/ViewSwitch';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('teacher.projects') };
}

/** One page of the All view; null when its cursor is unknown (an old or edited link). */
async function readClassPage(
  ...args: Parameters<typeof listSubmissionsForClass>
): Promise<Page<Submission> | null> {
  try {
    return await listSubmissionsForClass(...args);
  } catch (error) {
    if (isAppError(error) && error.code === 'validation') return null;
    throw error;
  }
}

// The teacher's projects (ARCHITECTURE.md 6.5, 3.7 "Teacher Projects"): the review queue, or
// every submission of one class. Only the view on screen is read.
export default async function TeacherProjectsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole('teacher');
  const [listed, sp, t, tNav] = await Promise.all([
    listClassesForTeacher(session, session.uid, { includeArchived: true }),
    searchParams,
    getTranslations('review'),
    getTranslations('nav'),
  ]);
  // listClassesForTeacher filters on the classes' teacher lists, the submission reads on the
  // teacher's own class list: only classes both agree on are offered, so none is refused.
  const classes = listed.filter((cls) => session.classIds.includes(cls.id));
  const params = parseReviewListParams(sp, classes);
  const header = (
    <PageHeader title={tNav('teacher.projects')} description={t('list.description')} />
  );
  const cls = classes.find((candidate) => candidate.id === params.classId);

  if (cls === undefined) {
    return (
      <>
        {header}
        <EmptyState
          icon={<School />}
          title={t('noClasses.title')}
          description={t('noClasses.description')}
          action={<LinkButton href="/teacher/classes">{t('noClasses.action')}</LinkButton>}
        />
      </>
    );
  }

  const allHref = allViewHref(cls.id, []);
  if (params.view === 'queue') {
    const queue = await listReviewQueue(session, session.classIds);
    return (
      <>
        {header}
        <ViewSwitch view="queue" queueCount={queue.length} allHref={allHref} />
        <ReviewQueue queue={queue} classes={classes} allHref={allHref} />
      </>
    );
  }

  const page = params.staleLink
    ? null
    : await readClassPage(session, cls.id, { limit: 50, cursor: params.trail.at(-1) ?? null });
  return (
    <>
      {header}
      <ViewSwitch view="all" queueCount={null} allHref={allHref} />
      <ClassSubmissions classes={classes} cls={cls} trail={params.trail} page={page} />
    </>
  );
}
