import { SquarePen } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { CourseList } from '@/components/course-editor/CourseList';
import { NewCourseButton } from '@/components/course-editor/NewCourseButton';
import type { EditorMode } from '@/components/course-editor/paths';
import { toPathwayOption, type PathwayOption } from '@/components/course-editor/rows';
import { PageHeader } from '@/components/layout';
import { Chip, EmptyState } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listCoursesByOwner, listOfficialCourses } from '@/lib/data/courses';
import { listPathways } from '@/lib/data/pathways';
import type { Course } from '@/types/content';
import { ROLE } from './load';

/** The authored (teacher) or official (admin) courses and "New course" (7.1). */
export async function CourseListScreen({ mode }: { mode: EditorMode }) {
  const session = await requireRole(ROLE[mode]);
  const [courses, pathways, t]: [Course[], PathwayOption[], Awaited<ReturnType<typeof getTranslations>>] =
    mode === 'teacher'
      ? await Promise.all([
          listCoursesByOwner(session, session.uid),
          Promise.resolve([]),
          getTranslations('courseEditor'),
        ])
      : await Promise.all([
          listOfficialCourses(session),
          listPathways(session).then((rows) => rows.map(toPathwayOption)),
          getTranslations('courseEditor'),
        ]);
  const admin = mode === 'admin';
  const ns = admin ? 'adminList' : 'list';
  const button = (size?: 'lg') => (
    <NewCourseButton
      mode={mode}
      pathways={pathways}
      officialCourses={courses.map(({ pathwayId, order }) => ({ pathwayId, order }))}
      size={size}
    />
  );

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={t(`${ns}.title`)}
        description={t(`${ns}.description`)}
        actions={courses.length > 0 ? button() : undefined}
      />
      {courses.length === 0 ? (
        <EmptyState
          icon={<SquarePen />}
          titleAs="h2"
          title={t(`${ns}.empty.title`)}
          description={t(`${ns}.empty.description`)}
          action={button('lg')}
        />
      ) : (
        <section aria-labelledby="course-list-title" className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="course-list-title" className="text-xl font-bold text-ink">
              {t(`${ns}.heading`)}
            </h2>
            <Chip>{t('list.count', { count: courses.length })}</Chip>
          </div>
          <CourseList courses={courses} mode={mode} pathways={pathways} />
        </section>
      )}
    </div>
  );
}
