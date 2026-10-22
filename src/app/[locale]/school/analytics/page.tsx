import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { AnalyticsStats } from '@/components/school/AnalyticsStats';
import { ClassesOverviewTable } from '@/components/school/ClassesOverviewTable';
import { CourseUsageTable } from '@/components/school/CourseUsageTable';
import { requireSchoolId } from '@/components/school/school-model';
import { requireRole } from '@/lib/auth/session';
import { getSchoolCourseUsage, getSchoolStats } from '@/lib/data/analytics';
import { listClassesForSchool } from '@/lib/data/classes';

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('school_admin');
  const tNav = await getTranslations('nav');
  return { title: tNav('school_admin.analytics') };
}

// How the school progresses (ARCHITECTURE.md 6.6, 3.7 "School Dashboard / Analytics" with
// WS-G-1): the enrollments in four numbers, the usage of every assigned course and the active
// classes. Read-only: no action lives here.
export default async function SchoolAnalyticsPage() {
  const session = await requireRole('school_admin');
  const schoolId = requireSchoolId(session);
  const [stats, usage, classes] = await Promise.all([
    getSchoolStats(session, schoolId),
    getSchoolCourseUsage(session, schoolId),
    listClassesForSchool(session, schoolId),
  ]);
  const t = await getTranslations('school');
  const tNav = await getTranslations('nav');

  return (
    <>
      <PageHeader title={tNav('school_admin.analytics')} description={t('analytics.description')} />
      <AnalyticsStats stats={stats} />
      <section
        aria-labelledby="usage-section-title"
        className="mt-10 flex min-w-0 flex-col gap-4"
      >
        <div className="flex flex-col gap-1">
          <h2 id="usage-section-title" className="text-xl font-bold text-ink">
            {t('analytics.usage.title')}
          </h2>
          <p className="text-sm text-ink-muted">{t('analytics.usage.description')}</p>
        </div>
        <CourseUsageTable rows={usage} />
      </section>
      <section
        aria-labelledby="classes-section-title"
        className="mt-10 flex min-w-0 flex-col gap-4"
      >
        <div className="flex flex-col gap-1">
          <h2 id="classes-section-title" className="text-xl font-bold text-ink">
            {t('analytics.classes.title')}
          </h2>
          <p className="text-sm text-ink-muted">{t('analytics.classes.description')}</p>
        </div>
        <ClassesOverviewTable classes={classes} />
      </section>
    </>
  );
}
