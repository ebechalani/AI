import type { Metadata } from 'next';
import { BookOpen, ChartColumn, Users } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import {
  assessmentsPath,
  assignPath,
  classPath,
  firstParam,
  TEACHER_PATHS,
} from '@/components/teacher/paths';
import { ReportFilters } from '@/components/teacher/ReportFilters';
import {
  classOptions,
  reportSummary,
  resolveReportClass,
  resolveReportCourse,
} from '@/components/teacher/reports-model';
import { ReportSummary } from '@/components/teacher/ReportSummary';
import { ReportTable } from '@/components/teacher/ReportTable';
import { Alert, EmptyState, LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { getClassReport } from '@/lib/data/analytics';
import { listClassesForTeacher } from '@/lib/data/classes';
import { getCourses } from '@/lib/data/courses';
import { pickTranslation } from '@/lib/i18n/content';
import { getPathname } from '@/lib/i18n/navigation';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  await requireRole('teacher');
  const tNav = await getTranslations('nav');
  return { title: tNav('teacher.reports') };
}

// Progress reports (ARCHITECTURE.md 6.5, 3.7 "Reports" with WS-E-1): one class and one of its
// assigned courses at a time; an unknown class or course in the URL falls back silently.
export default async function TeacherReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole('teacher');
  const [sp, locale, t, tNav] = await Promise.all([
    searchParams,
    getLocale(),
    getTranslations('reports'),
    getTranslations('nav'),
  ]);
  const header = <PageHeader title={tNav('teacher.reports')} description={t('description')} />;

  const classes = await listClassesForTeacher(session, session.uid, { includeArchived: true });
  const cls = resolveReportClass(classes, firstParam(sp.classId));
  if (cls === null) {
    return (
      <>
        {header}
        <EmptyState
          icon={<ChartColumn />}
          title={t('empty.noClasses.title')}
          description={t('empty.noClasses.description')}
          action={
            <LinkButton href={TEACHER_PATHS.classes}>{t('empty.noClasses.action')}</LinkButton>
          }
        />
      </>
    );
  }

  const courses = await getCourses(session, cls.assignedCourseIds);
  const course = resolveReportCourse(courses, firstParam(sp.courseId));
  const filters = (
    <ReportFilters
      action={getPathname({ href: TEACHER_PATHS.reports, locale })}
      classes={classOptions(classes)}
      classId={cls.id}
      courses={courses.map((candidate) => ({
        value: candidate.id,
        label: pickTranslation(candidate.translations, locale, candidate.defaultLocale).title,
      }))}
      courseId={course?.id ?? ''}
    />
  );

  if (course === null) {
    return (
      <>
        {header}
        {filters}
        <EmptyState
          // The class name may be one long word: it wraps at 375 px (7.1).
          className="wrap-anywhere"
          icon={<BookOpen />}
          title={t('empty.noCourses.title', { className: cls.name })}
          description={t('empty.noCourses.description')}
          action={
            <LinkButton href={cls.archived ? classPath(cls.id) : assignPath(cls.id)}>
              {cls.archived ? t('links.class') : t('empty.noCourses.action')}
            </LinkButton>
          }
        />
      </>
    );
  }

  const report = await getClassReport(session, cls.id, course.id);

  return (
    <>
      {header}
      {filters}
      {report.rows.length === 0 ? (
        <EmptyState
          className="wrap-anywhere"
          icon={<Users />}
          title={t('empty.noStudents.title', { className: cls.name })}
          description={t('empty.noStudents.description')}
          action={
            <LinkButton href={classPath(cls.id)}>{t('empty.noStudents.action')}</LinkButton>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <ReportSummary values={reportSummary(report.rows)} />
          {course.isOfficial && course.certificateEnabled && (
            <Alert tone="info" live="off">
              {t('certificateHint')}
            </Alert>
          )}
          <ReportTable report={report} />
          <div className="flex flex-wrap gap-2">
            <LinkButton href={classPath(cls.id)} variant="secondary">
              {t('links.class')}
            </LinkButton>
            <LinkButton href={assessmentsPath(cls.id, course.id)} variant="secondary">
              {t('links.quizzes')}
            </LinkButton>
            <LinkButton href={TEACHER_PATHS.projects} variant="secondary">
              {t('links.projects')}
            </LinkButton>
          </div>
        </div>
      )}
    </>
  );
}
