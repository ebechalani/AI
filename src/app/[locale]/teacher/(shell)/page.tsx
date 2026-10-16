import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CreateClassButton } from '@/components/classes/CreateClassButton';
import { NotVerifiedNotice } from '@/components/classes/NotVerifiedNotice';
import { PageHeader } from '@/components/layout';
import { ClassesOverview } from '@/components/teacher/ClassesOverview';
import { DashboardStats } from '@/components/teacher/DashboardStats';
import {
  classNameMap,
  classTotals,
  DASHBOARD_LIMITS,
  firstName,
  splitClasses,
} from '@/components/teacher/dashboard-model';
import { coursesPath, TEACHER_PATHS } from '@/components/teacher/paths';
import { PendingReviews } from '@/components/teacher/PendingReviews';
import { RecentQuizResults } from '@/components/teacher/RecentQuizResults';
import { TeacherOnboarding } from '@/components/teacher/TeacherOnboarding';
import { LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listClassesForTeacher } from '@/lib/data/classes';
import { listAttemptsForClasses } from '@/lib/data/quizzes';
import { countReviewQueue, listReviewQueue } from '@/lib/data/submissions';
import type { QuizAttempt } from '@/types/quiz';
import type { Submission } from '@/types/project';

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('teacher');
  const tNav = await getTranslations('nav');
  return { title: tNav('teacher.dashboard') };
}

// The teacher's home (ARCHITECTURE.md 6.5, 3.7 "Teacher Dashboard" with WS-E-1): classes, the
// work waiting for review and the latest quiz results.
export default async function TeacherDashboardPage() {
  const session = await requireRole('teacher');
  const now = new Date().toISOString();
  const [classes, t] = await Promise.all([
    listClassesForTeacher(session, session.uid, { includeArchived: true }),
    getTranslations('teacher'),
  ]);
  const { active } = splitClasses(classes);
  // Archived classes included, as the review queue reads them: both show the same count.
  const taught = session.classIds;
  const [pending, pendingCount, attempts]: [Submission[], number, QuizAttempt[]] =
    taught.length === 0
      ? [[], 0, []]
      : await Promise.all([
          listReviewQueue(session, taught, { limit: DASHBOARD_LIMITS.pending }),
          countReviewQueue(session, taught),
          listAttemptsForClasses(session, taught, DASHBOARD_LIMITS.attempts),
        ]);
  const schoolless = session.schoolId === null;

  return (
    <>
      <PageHeader
        title={t('dashboard.greeting', { name: firstName(session.displayName) })}
        description={t('dashboard.description')}
        actions={
          <>
            {/* One create button per page: the empty states carry their own. */}
            {active.length > 0 && (
              <CreateClassButton schoolless={schoolless} classHrefBase={TEACHER_PATHS.classes} />
            )}
            <LinkButton href={coursesPath()} variant="secondary">
              {t('dashboard.browseCourses')}
            </LinkButton>
          </>
        }
      />
      {schoolless && !session.verifiedEducator && <NotVerifiedNotice className="mb-6" />}
      {classes.length === 0 ? (
        <TeacherOnboarding schoolless={schoolless} />
      ) : (
        <>
          <DashboardStats totals={classTotals(active)} pending={pendingCount} />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <ClassesOverview
                classes={active}
                total={active.length}
                now={now}
                viewerUid={session.uid}
                schoolless={schoolless}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-8">
              <PendingReviews submissions={pending} count={pendingCount} />
              <RecentQuizResults
                attempts={attempts}
                classNames={classNameMap(classes)}
                firstActiveClassId={active[0]?.id ?? null}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
