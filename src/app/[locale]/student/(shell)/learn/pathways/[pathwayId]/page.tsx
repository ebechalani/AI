import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { CourseCard } from '@/components/domain';
import { PageHeader } from '@/components/layout';
import { EmptyState, LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listPublishedCoursesByPathway } from '@/lib/data/courses';
import { listEnrollmentsForUser } from '@/lib/data/enrollments';
import { isAppError } from '@/lib/errors';
import { pickTranslation } from '@/lib/i18n/content';
import { loadPathway } from './_components/load';
import { pathwayCourseProgress } from './_components/pathway-model';
import { PathwayOverview } from './_components/PathwayOverview';

type Params = Promise<{ pathwayId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { pathwayId } = await params;
  const tNav = await getTranslations('nav');
  try {
    const pathway = await loadPathway(pathwayId);
    if (pathway === null || pathway.audience !== 'student') return { title: tNav('student.learn') };
    const text = pickTranslation(pathway.translations, await getLocale(), pathway.defaultLocale);
    return { title: text.title, description: text.tagline };
  } catch (error) {
    if (isAppError(error)) return { title: tNav('student.learn') };
    throw error;
  }
}

// A pathway with its courses and the student's own progress (ARCHITECTURE.md 6.4). Teacher
// Academy is not a student pathway, so it is not found here.
export default async function StudentPathwayPage({ params }: { params: Params }) {
  const session = await requireRole('student');
  const { pathwayId } = await params;
  const pathway = await loadPathway(pathwayId);
  if (pathway === null || pathway.audience !== 'student') notFound();

  const [courses, enrollments, locale, t, tNav] = await Promise.all([
    listPublishedCoursesByPathway(pathway.id),
    listEnrollmentsForUser(session, session.uid),
    getLocale(),
    getTranslations('learn'),
    getTranslations('nav'),
  ]);
  const visible = courses.filter((course) => course.audience === 'student');
  const byCourse = new Map(enrollments.map((enrollment) => [enrollment.courseId, enrollment]));
  const { enrolled, completed, total } = pathwayCourseProgress(visible, byCourse);
  const text = pickTranslation(pathway.translations, locale, pathway.defaultLocale);

  return (
    <>
      <PageHeader
        title={text.title}
        description={text.tagline || undefined}
        breadcrumbs={[{ label: tNav('student.learn'), href: '/student/learn' }, { label: text.title }]}
      />
      <div className="flex flex-col gap-10">
        <PathwayOverview
          pathway={pathway}
          enrolled={enrolled}
          completed={completed}
          total={total}
        />
        <section aria-labelledby="pathway-courses" className="flex min-w-0 flex-col gap-4">
          <h2 id="pathway-courses" className="text-xl font-bold text-ink">
            {t('pathway.courses')}
          </h2>
          {visible.length === 0 ? (
            <EmptyState
              icon={<BookOpen />}
              title={t('pathway.empty.title')}
              description={t('pathway.empty.description')}
              action={
                <LinkButton href="/student/learn" variant="secondary">
                  {t('course.back')}
                </LinkButton>
              }
            />
          ) : (
            <ol className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((course) => (
                <li key={course.id} className="min-w-0">
                  <CourseCard
                    course={course}
                    href={`/student/learn/courses/${course.id}`}
                    progressPercent={byCourse.get(course.id)?.progressPercent}
                  />
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
