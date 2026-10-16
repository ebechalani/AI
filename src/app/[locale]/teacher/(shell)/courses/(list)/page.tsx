import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { CourseCatalog } from '@/components/teacher/CourseCatalog';
import {
  progressByCourse,
  resolveCourseTab,
  schoolTabCourses,
  splitPathways,
} from '@/components/teacher/courses-model';
import { firstParam } from '@/components/teacher/paths';
import { requireRole } from '@/lib/auth/session';
import {
  listCoursesByOwner,
  listPublishedCoursesByPathway,
  listSchoolCourses,
} from '@/lib/data/courses';
import { listEnrollmentsForUser } from '@/lib/data/enrollments';
import { listPublishedPathways } from '@/lib/data/pathways';
import type { Course } from '@/types/content';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('teacher');
  const tNav = await getTranslations('nav');
  return { title: tNav('teacher.courses') };
}

// The teacher's courses (ARCHITECTURE.md 6.5, 3.7 "Teacher Courses" with WS-E-1): the official
// catalog by pathway, the Teacher Academy, the school's shared courses and the teacher's own.
// Every tab is read on every visit; `?tab=` only chooses the one open first.
export default async function TeacherCoursesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole('teacher');
  const sp = await searchParams;
  const hasSchool = session.schoolId !== null;
  const tab = resolveCourseTab(firstParam(sp.tab), hasSchool);
  const [pathways, own, school, enrollments, t, tNav] = await Promise.all([
    listPublishedPathways(),
    listCoursesByOwner(session, session.uid),
    session.schoolId === null
      ? Promise.resolve<Course[]>([])
      : listSchoolCourses(session, session.schoolId),
    listEnrollmentsForUser(session, session.uid),
    getTranslations('teacher'),
    getTranslations('nav'),
  ]);
  const { student, academy } = splitPathways(pathways);
  const [studentCourses, academyCourses] = await Promise.all([
    Promise.all(student.map((pathway) => listPublishedCoursesByPathway(pathway.id))),
    Promise.all(academy.map((pathway) => listPublishedCoursesByPathway(pathway.id))),
  ]);

  return (
    <>
      <PageHeader title={tNav('teacher.courses')} description={t('courses.description')} />
      <CourseCatalog
        tab={tab}
        hasSchool={hasSchool}
        catalog={student.map((pathway, index) => ({
          pathway,
          courses: studentCourses[index] ?? [],
        }))}
        academy={academyCourses.flat()}
        school={schoolTabCourses(school, session.uid)}
        mine={own}
        progress={progressByCourse(enrollments)}
      />
    </>
  );
}
