import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { splitCatalog, usageByCourse } from '@/components/school/course-admin-model';
import { SchoolCourseSection } from '@/components/school/SchoolCourseSection';
import { requireSchoolId } from '@/components/school/school-model';
import { requireRole } from '@/lib/auth/session';
import { getSchoolCourseUsage } from '@/lib/data/analytics';
import { listPublishedCoursesByPathway, listSchoolCourses } from '@/lib/data/courses';
import { listPublishedPathways } from '@/lib/data/pathways';
import { pickTranslation } from '@/lib/i18n/content';
import { listAllSchoolTeachers } from '../../_lib/load';

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('school_admin');
  const tNav = await getTranslations('nav');
  return { title: tNav('school_admin.courses') };
}

// The courses of the school (ARCHITECTURE.md 6.6, 3.7 "School Courses" with WS-G-1): the
// RoboHolic catalog by pathway with its use in the school, the Teacher Academy, and every course
// the school's teachers made (drafts and private ones included).
export default async function SchoolCoursesPage() {
  const session = await requireRole('school_admin');
  const schoolId = requireSchoolId(session);
  const [pathways, schoolCourses, usageRows, locale] = await Promise.all([
    listPublishedPathways(),
    listSchoolCourses(session, schoolId),
    getSchoolCourseUsage(session, schoolId),
    getLocale(),
  ]);
  const { student, academy } = splitCatalog(pathways);
  const [studentCourses, academyCourses, teachers] = await Promise.all([
    Promise.all(student.map((pathway) => listPublishedCoursesByPathway(pathway.id))),
    Promise.all(academy.map((pathway) => listPublishedCoursesByPathway(pathway.id))),
    // The authors' names, only when the school has a course of its own.
    schoolCourses.length > 0 ? listAllSchoolTeachers(session, schoolId) : Promise.resolve([]),
  ]);
  const t = await getTranslations('school');
  const tNav = await getTranslations('nav');

  const usage = usageByCourse(usageRows);
  const officialGroups = student.map((pathway, index) => ({
    title: pickTranslation(pathway.translations, locale, pathway.defaultLocale).title,
    courses: studentCourses[index] ?? [],
  }));
  const academyList = academyCourses.flat();
  const authors = Object.fromEntries(teachers.map((teacher) => [teacher.id, teacher.displayName]));

  return (
    <>
      <PageHeader title={tNav('school_admin.courses')} description={t('courses.description')} />
      <div className="flex flex-col gap-10">
        {officialGroups.some((group) => group.courses.length > 0) && (
          <SchoolCourseSection
            id="official"
            title={t('courses.officialTitle')}
            description={t('courses.officialDescription')}
            groups={officialGroups}
            usage={usage}
            showUsage
            showStatus={false}
          />
        )}
        {academyList.length > 0 && (
          <SchoolCourseSection
            id="academy"
            title={t('courses.academyTitle')}
            description={t('courses.academyDescription')}
            groups={[{ title: null, courses: academyList }]}
            usage={usage}
            showUsage={false}
            showStatus={false}
          />
        )}
        <SchoolCourseSection
          id="school"
          title={t('courses.schoolTitle')}
          description={t('courses.schoolDescription')}
          groups={[{ title: null, courses: schoolCourses }]}
          usage={usage}
          showUsage
          authors={authors}
          showStatus
          empty={{
            title: t('courses.schoolEmpty.title'),
            description: t('courses.schoolEmpty.description'),
          }}
        />
      </div>
    </>
  );
}
