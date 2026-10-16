import type { Metadata } from 'next';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import {
  AssignableCourseList,
  type AssignableSection,
} from '@/components/classes/AssignableCourseList';
import { PageHeader } from '@/components/layout';
import { isAssignable, schoolTabCourses, splitPathways } from '@/components/teacher/courses-model';
import { classPath, coursesPath, TEACHER_PATHS } from '@/components/teacher/paths';
import { Alert, EmptyState, LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listCoursesByOwner, listPublishedCoursesByPathway, listSchoolCourses } from '@/lib/data/courses';
import { listPublishedPathways } from '@/lib/data/pathways';
import { pickTranslation } from '@/lib/i18n/content';
import type { Course } from '@/types/content';
import { classOrNotFound } from '../_lib/load';

type Params = Promise<{ classId: string }>;

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('teacher');
  const t = await getTranslations('classes');
  return { title: t('assign.title') };
}

// Assign a course to a class (ARCHITECTURE.md 6.5, 3.7 "Assign a course" with WS-E-1): the
// assignable catalog by pathway, then the school's shared courses and the teacher's own.
export default async function TeacherAssignCoursePage({ params }: { params: Params }) {
  const session = await requireRole('teacher');
  const { classId } = await params;
  const cls = await classOrNotFound(classId);
  const [locale, t, tNav] = await Promise.all([
    getLocale(),
    getTranslations('classes'),
    getTranslations('nav'),
  ]);

  // `wrap-anywhere`: the description and the back button hold the class name, which may be one
  // long word; they wrap at 375 px instead of widening the page (7.1).
  const header = (
    <PageHeader
      className="wrap-anywhere"
      title={t('assign.title')}
      description={t('assign.description', { className: cls.name })}
      breadcrumbs={[
        { label: tNav('teacher.classes'), href: TEACHER_PATHS.classes },
        { label: cls.name, href: classPath(cls.id) },
        { label: t('assign.title') },
      ]}
      actions={
        <LinkButton href={classPath(cls.id)} variant="secondary">
          <ArrowLeft aria-hidden="true" className="rtl:-scale-x-100" />
          {t('assign.back', { className: cls.name })}
        </LinkButton>
      }
    />
  );

  // No catalog read for a class that cannot take an assignment.
  if (cls.archived) {
    return (
      <>
        {header}
        <Alert tone="warning" live="off">
          {t('assign.archived')}
        </Alert>
      </>
    );
  }

  const [pathways, own, school] = await Promise.all([
    listPublishedPathways(),
    listCoursesByOwner(session, session.uid),
    session.schoolId === null
      ? Promise.resolve<Course[]>([])
      : listSchoolCourses(session, session.schoolId),
  ]);
  const { student } = splitPathways(pathways);
  const byPathway = await Promise.all(
    student.map((pathway) => listPublishedCoursesByPathway(pathway.id)),
  );

  const sections: AssignableSection[] = [
    ...student.map((pathway, index) => {
      const text = pickTranslation(pathway.translations, locale, pathway.defaultLocale);
      return {
        key: pathway.id,
        title: text.title,
        description: text.tagline || undefined,
        courses: (byPathway[index] ?? []).filter(isAssignable),
      };
    }),
    {
      key: 'school',
      title: t('assign.schoolTitle'),
      courses: schoolTabCourses(school, session.uid).filter(isAssignable),
    },
    { key: 'mine', title: t('assign.mineTitle'), courses: own.filter(isAssignable) },
  ].filter((section) => section.courses.length > 0);

  return (
    <>
      {header}
      {sections.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title={t('assign.empty.title')}
          description={t('assign.empty.description')}
          action={
            <LinkButton href={coursesPath()} variant="secondary">
              {tNav('teacher.courses')}
            </LinkButton>
          }
        />
      ) : (
        <AssignableCourseList
          classId={cls.id}
          className={cls.name}
          sections={sections}
          assignedIds={cls.assignedCourseIds}
        />
      )}
    </>
  );
}
