import type { Metadata } from 'next';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import {
  isAssignable,
  isAssignableSchoolCourse,
  splitCatalog,
} from '@/components/school/course-admin-model';
import { SCHOOL_PATHS, schoolClassPath } from '@/components/school/paths';
import { SchoolAssignableList, type AssignSection } from '@/components/school/SchoolAssignableList';
import { requireSchoolId } from '@/components/school/school-model';
import { Alert, EmptyState, LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listPublishedCoursesByPathway, listSchoolCourses } from '@/lib/data/courses';
import { listPublishedPathways } from '@/lib/data/pathways';
import { pickTranslation } from '@/lib/i18n/content';
import { classOrNotFound } from '../../../_lib/load';

type Params = Promise<{ classId: string }>;

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('school_admin');
  const t = await getTranslations('school');
  return { title: t('assign.title') };
}

// Assign a course to a class of the school (ARCHITECTURE.md 6.6, 3.7 "School assign", WS-G-1):
// the official student catalog by pathway, then the published student courses shared in the
// school. An archived class reads nothing more.
export default async function SchoolAssignCoursePage({ params }: { params: Params }) {
  const session = await requireRole('school_admin');
  const schoolId = requireSchoolId(session);
  const { classId } = await params;
  const cls = await classOrNotFound(classId);
  const locale = await getLocale();
  const t = await getTranslations('school');
  const tNav = await getTranslations('nav');

  const back = (
    <LinkButton href={schoolClassPath(cls.id)} variant="secondary">
      <ArrowLeft aria-hidden="true" className="rtl:-scale-x-100" />
      {t('assign.back', { className: cls.name })}
    </LinkButton>
  );
  // `wrap-anywhere`: the description and the back button hold the class name, which may be one
  // long word; they wrap at 375 px instead of widening the page (7.1).
  const header = (
    <PageHeader
      className="wrap-anywhere"
      title={t('assign.title')}
      description={t('assign.description', { className: cls.name })}
      breadcrumbs={[
        { label: tNav('school_admin.classes'), href: SCHOOL_PATHS.classes },
        { label: cls.name, href: schoolClassPath(cls.id) },
        { label: t('assign.title') },
      ]}
      actions={back}
    />
  );

  if (cls.archived) {
    return (
      <>
        {header}
        <Alert tone="info" live="off">
          {t('assign.archived')}
        </Alert>
      </>
    );
  }

  const [pathways, schoolCourses] = await Promise.all([
    listPublishedPathways(),
    listSchoolCourses(session, schoolId),
  ]);
  const { student } = splitCatalog(pathways);
  const byPathway = await Promise.all(
    student.map((pathway) => listPublishedCoursesByPathway(pathway.id)),
  );

  const sections: AssignSection[] = [
    ...student.map((pathway, index) => ({
      key: pathway.id,
      title: pickTranslation(pathway.translations, locale, pathway.defaultLocale).title,
      courses: (byPathway[index] ?? []).filter(isAssignable),
    })),
    {
      key: 'school',
      title: t('assign.schoolTitle'),
      description: t('assign.schoolDescription'),
      courses: schoolCourses.filter(isAssignableSchoolCourse),
    },
  ].filter((section) => section.courses.length > 0);

  return (
    <>
      {header}
      {sections.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title={t('assign.empty.title')}
          description={t('assign.empty.description')}
        />
      ) : (
        <SchoolAssignableList
          classId={cls.id}
          className={cls.name}
          sections={sections}
          assignedIds={cls.assignedCourseIds}
        />
      )}
    </>
  );
}
