import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CourseCard } from '@/components/domain';
import { CONTAINER, PathwayHero } from '@/components/marketing';
import { EmptyState, LinkButton } from '@/components/ui';
import { listPublishedCoursesByPathway } from '@/lib/data/courses';
import { getPublishedPathway } from '@/lib/data/pathways';
import { pickTranslation } from '@/lib/i18n/content';
import { routing } from '@/lib/i18n/routing';
import type { Course } from '@/types/content';

export const dynamic = 'force-dynamic';

type Params = Promise<{ locale: string; pathwayId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, pathwayId } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const pathway = await getPublishedPathway(pathwayId);
  if (pathway === null) return {};
  const text = pickTranslation(pathway.translations, locale, pathway.defaultLocale);
  return { title: text.title, description: text.tagline };
}

// There is no public course page: a course opens inside the visitor's own space after login.
// Teacher Academy courses live under /teacher, every other course under /student.
function courseHref(course: Course): string {
  const target =
    course.audience === 'teacher'
      ? `/teacher/courses/${course.id}`
      : `/student/learn/courses/${course.id}`;
  return `/login?next=${target}`;
}

export default async function PathwayPage({ params }: { params: Params }) {
  const { locale, pathwayId } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const pathway = await getPublishedPathway(pathwayId);
  if (pathway === null) notFound();
  const [t, courses] = await Promise.all([
    getTranslations('home'),
    listPublishedCoursesByPathway(pathway.id),
  ]);

  return (
    <>
      <PathwayHero pathway={pathway} courseCount={courses.length} />
      <div className={`${CONTAINER} flex flex-col gap-10 py-10 sm:py-14`}>
        <section aria-labelledby="pathway-courses" className="flex flex-col gap-6">
          <h2 id="pathway-courses" className="text-2xl font-bold tracking-tight text-ink">
            {t('pathwayPage.courses')}
          </h2>
          {courses.length === 0 ? (
            <EmptyState
              icon={<BookOpen />}
              title={t('pathwayPage.empty.title')}
              description={t('pathwayPage.empty.description')}
            />
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <li key={course.id} className="min-w-0">
                  <CourseCard course={course} href={courseHref(course)} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside
          aria-labelledby="pathway-access"
          className="flex flex-col gap-4 rounded-card border border-brand-100 bg-linear-to-br from-brand-50 via-surface to-accent-50 p-6 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-8"
        >
          <div className="flex flex-col gap-1">
            <h2 id="pathway-access" className="text-xl font-bold text-ink">
              {t('pathwayPage.access.title')}
            </h2>
            <p className="text-sm text-ink-muted">{t('pathwayPage.access.description')}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/login" variant="secondary">
              {t('pathwayPage.access.login')}
            </LinkButton>
            <LinkButton href={pathway.audience === 'teacher' ? '/signup?role=teacher' : '/signup'}>
              {t('pathwayPage.access.signup')}
            </LinkButton>
          </div>
        </aside>
      </div>
    </>
  );
}
