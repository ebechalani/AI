import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { requireRole } from '@/lib/auth/session';
import { getCourses } from '@/lib/data/courses';
import { listEnrollmentsForUser } from '@/lib/data/enrollments';
import { listPublishedPathways } from '@/lib/data/pathways';
import { pathwayProgress, splitMyCourses } from './_components/learn-model';
import { MyCourses } from './_components/MyCourses';
import { PathwayCatalog } from './_components/PathwayCatalog';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('student.learn') };
}

// My courses and the pathway catalog (ARCHITECTURE.md 6.4): the Student Learn reads of 3.7
// plus the published-pathways catalog query.
export default async function StudentLearnPage() {
  const session = await requireRole('student');
  const [enrollments, pathways, t, tNav] = await Promise.all([
    listEnrollmentsForUser(session, session.uid),
    listPublishedPathways(),
    getTranslations('learn'),
    getTranslations('nav'),
  ]);
  const courses = await getCourses(
    session,
    enrollments.map((enrollment) => enrollment.courseId),
  );
  const { inProgress, completed } = splitMyCourses(enrollments, courses);
  const catalog = pathways.filter((pathway) => pathway.audience === 'student');

  return (
    <>
      <PageHeader title={tNav('student.learn')} description={t('overview.description')} />
      <div className="flex flex-col gap-10">
        <MyCourses inProgress={inProgress} completed={completed} />
        <PathwayCatalog pathways={catalog} progress={pathwayProgress(enrollments, courses)} />
      </div>
    </>
  );
}
