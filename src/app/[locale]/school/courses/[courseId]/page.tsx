import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Eye } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { CourseClassesCard } from '@/components/school/CourseClassesCard';
import {
  classesWithCourse,
  firstLessonId,
  usageByCourse,
} from '@/components/school/course-admin-model';
import { CourseOutlinePreview } from '@/components/school/CourseOutlinePreview';
import { CourseUsageCard } from '@/components/school/CourseUsageCard';
import { previewLessonPath, SCHOOL_PATHS } from '@/components/school/paths';
import { requireSchoolId } from '@/components/school/school-model';
import { CourseFacts } from '@/components/teacher/CourseFacts';
import { Alert, LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { getSchoolCourseUsage } from '@/lib/data/analytics';
import { listClassesForSchool } from '@/lib/data/classes';
import { isAppError } from '@/lib/errors';
import { pickTranslation } from '@/lib/i18n/content';
import { getCourseAccess } from '@/lib/services/access';
import type { CourseUsageRow } from '@/types/analytics';
import type { SchoolClass } from '@/types/school';
import { loadOutline, outlineOrNotFound } from '../../_lib/load';

type Params = Promise<{ courseId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  await requireRole('school_admin');
  const { courseId } = await params;
  try {
    const { course } = await loadOutline(courseId);
    const locale = await getLocale();
    return { title: pickTranslation(course.translations, locale, course.defaultLocale).title };
  } catch (error) {
    if (!isAppError(error)) throw error;
    const tNav = await getTranslations('nav');
    return { title: tNav('school_admin.courses') };
  }
}

// One course as the school admin sees it (ARCHITECTURE.md 6.6, 3.7 "School course detail",
// WS-G-1): its facts, its lessons linking to the read-only preview, and how the school's classes
// use it. Teacher Academy courses are never assigned: no usage reads for them.
export default async function SchoolCoursePage({ params }: { params: Params }) {
  const session = await requireRole('school_admin');
  const schoolId = requireSchoolId(session);
  const { courseId } = await params;
  const outline = await outlineOrNotFound(courseId);
  const { course, modules, lessons } = outline;
  const forStudents = course.audience === 'student';
  const [access, usageRows, classes, locale] = await Promise.all([
    getCourseAccess(session, course),
    forStudents
      ? getSchoolCourseUsage(session, schoolId)
      : Promise.resolve<CourseUsageRow[]>([]),
    forStudents
      ? listClassesForSchool(session, schoolId)
      : Promise.resolve<SchoolClass[]>([]),
    getLocale(),
  ]);
  // A course the outline read let through is visible; `not_visible` cannot follow it.
  if (!access.allowed && access.reason === 'not_visible') notFound();
  const t = await getTranslations('school');
  const tNav = await getTranslations('nav');

  const text = pickTranslation(course.translations, locale, course.defaultLocale);
  const first = firstLessonId(outline);

  return (
    <>
      <PageHeader
        className="wrap-anywhere"
        title={text.title}
        description={text.summary || undefined}
        breadcrumbs={[
          { label: tNav('school_admin.courses'), href: SCHOOL_PATHS.courses },
          { label: text.title },
        ]}
        actions={
          access.allowed && first !== null ? (
            <LinkButton href={previewLessonPath(course.id, first)}>
              <Eye aria-hidden="true" />
              {t('course.previewFirst')}
            </LinkButton>
          ) : undefined
        }
      />
      {!access.allowed && (
        <Alert tone="warning" title={t('course.license.title')} className="mb-6">
          {t('course.license.description')}
        </Alert>
      )}
      {!course.isOfficial && course.status === 'draft' && (
        <Alert tone="info" live="off" title={t('course.draft.title')} className="mb-6">
          {t('course.draft.description')}
        </Alert>
      )}
      {course.status === 'archived' && (
        <Alert tone="info" live="off" className="mb-6">
          {t('course.archived')}
        </Alert>
      )}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* First in the DOM: on phones the facts sit right under the header. */}
        <aside className="flex min-w-0 flex-col gap-6 lg:col-start-3 lg:row-start-1">
          <CourseFacts
            course={course}
            lessonCount={lessons.length}
            moduleCount={modules.length}
            isOwner={!course.isOfficial}
          />
          {forStudents && <CourseUsageCard usage={usageByCourse(usageRows).get(course.id)} />}
          {forStudents && <CourseClassesCard classes={classesWithCourse(classes, course.id)} />}
        </aside>
        <div className="min-w-0 lg:col-span-2 lg:col-start-1 lg:row-start-1">
          <CourseOutlinePreview
            courseId={course.id}
            modules={modules}
            lessons={lessons}
            linked={access.allowed}
          />
        </div>
      </div>
    </>
  );
}
