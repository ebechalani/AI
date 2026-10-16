import type { Metadata } from 'next';
import { School } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { ClassCard } from '@/components/classes/ClassCard';
import { CreateClassButton } from '@/components/classes/CreateClassButton';
import { NotVerifiedNotice } from '@/components/classes/NotVerifiedNotice';
import { StatusChip } from '@/components/domain';
import { PageHeader } from '@/components/layout';
import { splitClasses } from '@/components/teacher/dashboard-model';
import { classPath, TEACHER_PATHS } from '@/components/teacher/paths';
import { EmptyState } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listClassesForTeacher } from '@/lib/data/classes';
import { Link } from '@/lib/i18n/navigation';

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('teacher');
  const tNav = await getTranslations('nav');
  return { title: tNav('teacher.classes') };
}

// The teacher's classes (ARCHITECTURE.md 6.5, 3.7 "Teacher Classes"): the active ones as cards,
// the archived ones in a disclosure.
export default async function TeacherClassesPage() {
  const session = await requireRole('teacher');
  const now = new Date().toISOString();
  const [classes, t, tNav] = await Promise.all([
    listClassesForTeacher(session, session.uid, { includeArchived: true }),
    getTranslations('classes'),
    getTranslations('nav'),
  ]);
  const { active, archived } = splitClasses(classes);
  const schoolless = session.schoolId === null;
  const createButton = (size?: 'lg') => (
    <CreateClassButton schoolless={schoolless} classHrefBase={TEACHER_PATHS.classes} size={size} />
  );

  return (
    <>
      <PageHeader
        title={tNav('teacher.classes')}
        description={t('list.description')}
        actions={active.length > 0 ? createButton() : undefined}
      />
      {schoolless && !session.verifiedEducator && <NotVerifiedNotice className="mb-6" />}
      {classes.length === 0 ? (
        <EmptyState
          icon={<School />}
          title={t('list.empty.title')}
          description={t('list.empty.description')}
          action={createButton('lg')}
        />
      ) : active.length === 0 ? (
        <EmptyState
          icon={<School />}
          title={t('list.noActive.title')}
          description={t('list.noActive.description')}
          action={createButton()}
        />
      ) : (
        <section aria-labelledby="active-classes-title" className="flex flex-col gap-4">
          <h2 id="active-classes-title" className="sr-only">
            {t('list.activeTitle')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((cls) => (
              <ClassCard
                key={cls.id}
                cls={cls}
                href={classPath(cls.id)}
                now={now}
                viewerUid={session.uid}
              />
            ))}
          </div>
        </section>
      )}
      {archived.length > 0 && (
        <details className="group mt-8 rounded-card border border-border bg-surface p-5">
          <summary className="cursor-pointer rounded-sm font-semibold text-ink">
            {t('list.archivedSummary', { count: archived.length })}
          </summary>
          <p className="mt-3 text-sm text-ink-muted">{t('list.archivedHint')}</p>
          <ul className="mt-3 divide-y divide-border">
            {archived.map((cls) => (
              <li key={cls.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                <Link
                  href={classPath(cls.id)}
                  className="min-w-0 rounded-sm font-medium break-words text-ink underline-offset-4 hover:text-brand-700 hover:underline"
                >
                  {cls.name}
                </Link>
                {cls.gradeLabel && (
                  <span className="text-sm text-ink-muted">{cls.gradeLabel}</span>
                )}
                <StatusChip status="archived" />
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
