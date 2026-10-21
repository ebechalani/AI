import { BookOpen, GraduationCap, School, SquarePen } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { EmptyState, LinkButton, type TabItem } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import type { Course, Pathway } from '@/types/content';
import { CourseGrid } from './CourseGrid';
import { MyCoursesList } from './MyCoursesList';
import { TEACHER_PATHS, type CourseTab } from './paths';
import { RevealingTabs } from './RevealingTabs';

export interface CourseCatalogProps {
  /** The tab open first. */
  tab: CourseTab;
  hasSchool: boolean;
  catalog: { pathway: Pathway; courses: Course[] }[];
  academy: Course[];
  school: Course[];
  mine: Course[];
  /** courseId → the teacher's own progress (Teacher Academy). */
  progress: Record<string, number>;
}

function Description({ children }: { children: string }) {
  return <p className="mb-5 max-w-2xl text-sm text-ink-muted">{children}</p>;
}

/** The four course lists of a teacher, as tabs. */
export function CourseCatalog({
  tab,
  hasSchool,
  catalog,
  academy,
  school,
  mine,
  progress,
}: CourseCatalogProps) {
  const t = useTranslations('teacher');
  const locale = useLocale();
  const withCourses = catalog.filter((entry) => entry.courses.length > 0);

  const createLink = (
    <LinkButton href={TEACHER_PATHS.create}>
      <SquarePen aria-hidden="true" />
      {t('courses.mine.create')}
    </LinkButton>
  );

  const tabs: TabItem[] = [
    {
      value: 'catalog',
      label: t('courses.tabs.catalog'),
      content: (
        <>
          <Description>{t('courses.catalog.description')}</Description>
          {withCourses.length === 0 ? (
            <EmptyState
              icon={<BookOpen />}
              title={t('courses.catalog.empty.title')}
              description={t('courses.catalog.empty.description')}
            />
          ) : (
            <div className="flex flex-col gap-10">
              {withCourses.map(({ pathway, courses }) => {
                const text = pickTranslation(
                  pathway.translations,
                  locale,
                  pathway.defaultLocale,
                );
                const headingId = `pathway-${pathway.id}`;
                return (
                  <section
                    key={pathway.id}
                    aria-labelledby={headingId}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex flex-col gap-1">
                      <h2 id={headingId} className="text-xl font-bold break-words text-ink">
                        {text.title}
                      </h2>
                      {text.tagline && <p className="text-sm text-ink-muted">{text.tagline}</p>}
                    </div>
                    <CourseGrid courses={courses} />
                  </section>
                );
              })}
            </div>
          )}
        </>
      ),
    },
    {
      value: 'academy',
      label: t('courses.tabs.academy'),
      content: (
        <>
          <Description>{t('courses.academy.description')}</Description>
          {academy.length === 0 ? (
            <EmptyState
              icon={<GraduationCap />}
              title={t('courses.academy.empty.title')}
              description={t('courses.academy.empty.description')}
            />
          ) : (
            <CourseGrid courses={academy} progress={progress} />
          )}
        </>
      ),
    },
    ...(hasSchool
      ? [
          {
            value: 'school',
            label: t('courses.tabs.school'),
            content: (
              <>
                <Description>{t('courses.school.description')}</Description>
                {school.length === 0 ? (
                  <EmptyState
                    icon={<School />}
                    title={t('courses.school.empty.title')}
                    description={t('courses.school.empty.description')}
                  />
                ) : (
                  <CourseGrid courses={school} />
                )}
              </>
            ),
          },
        ]
      : []),
    {
      value: 'mine',
      label: t('courses.tabs.mine'),
      content:
        mine.length === 0 ? (
          <>
            <Description>{t('courses.mine.description')}</Description>
            <EmptyState
              icon={<SquarePen />}
              title={t('courses.mine.empty.title')}
              description={t('courses.mine.empty.description')}
              action={createLink}
            />
          </>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-2xl text-sm text-ink-muted">{t('courses.mine.description')}</p>
              {createLink}
            </div>
            <MyCoursesList courses={mine} />
          </>
        ),
    },
  ];

  return (
    <RevealingTabs key={tab} tabs={tabs} aria-label={t('courses.tabsLabel')} defaultValue={tab} />
  );
}
