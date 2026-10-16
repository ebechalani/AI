import type { Metadata } from 'next';
import { ClipboardCheck, Users } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import {
  ASSESSMENTS_PATH,
  assessmentsHref,
  firstParam,
  pageLinks,
  parsePaging,
  resolveClassId,
  resolveCourseId,
} from '@/components/quiz/assessments-model';
import { own } from '@/components/quiz/quiz-model';
import { EmptyState, LinkButton, Pagination } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listClassesForTeacher } from '@/lib/data/classes';
import { getCourses } from '@/lib/data/courses';
import { listAttemptsForClass } from '@/lib/data/quizzes';
import { isAppError } from '@/lib/errors';
import { pickTranslation } from '@/lib/i18n/content';
import { getPathname, redirect } from '@/lib/i18n/navigation';
import type { Page } from '@/types/common';
import type { QuizAttempt } from '@/types/quiz';
import { AssessmentFilters } from './_components/AssessmentFilters';
import { AttemptsTable } from './_components/AttemptsTable';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('teacher.assessments') };
}

// Quiz results by class and course (ARCHITECTURE.md 6.5): the Assessments reads of 3.7.
export default async function TeacherAssessmentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole('teacher');
  const [raw, locale, t, tNav] = await Promise.all([
    searchParams,
    getLocale(),
    getTranslations('assessments'),
    getTranslations('nav'),
  ]);
  const header = <PageHeader title={tNav('teacher.assessments')} description={t('description')} />;

  // Archived classes stay: their attempts are historical snapshots.
  const classes = await listClassesForTeacher(session, session.uid, { includeArchived: true });
  const classId = resolveClassId(firstParam(raw.classId), classes);
  const cls = classes.find((candidate) => candidate.id === classId);
  if (cls === undefined) {
    return (
      <>
        {header}
        <EmptyState
          icon={<Users />}
          title={t('empty.noClassesTitle')}
          description={t('empty.noClassesDescription')}
          action={<LinkButton href="/teacher/classes">{t('empty.noClassesAction')}</LinkButton>}
        />
      </>
    );
  }

  const assigned = await getCourses(session, cls.assignedCourseIds);
  const courseId = resolveCourseId(
    firstParam(raw.courseId),
    assigned.map((course) => course.id),
  );
  const { cursor, trail } = parsePaging(firstParam(raw.cursor), firstParam(raw.trail));

  let page: Page<QuizAttempt>;
  try {
    page = await listAttemptsForClass(session, cls.id, {
      courseId: courseId ?? undefined,
      page: { cursor },
    });
  } catch (error) {
    // A stale or forged cursor: the first page of the same filters.
    if (isAppError(error) && error.code === 'validation') {
      redirect({ href: assessmentsHref({ classId: cls.id, courseId }), locale });
    }
    throw error;
  }

  // Pupils may also take courses the class does not assign (3.4): name those courses too.
  const known = new Set(assigned.map((course) => course.id));
  const extra = [...new Set(page.items.map((attempt) => attempt.courseId))].filter(
    (id) => !known.has(id),
  );
  const others = extra.length > 0 ? await getCourses(session, extra) : [];
  const courseTitles = Object.fromEntries(
    [...assigned, ...others].map((course) => [
      course.id,
      pickTranslation(course.translations, locale, course.defaultLocale).title,
    ]),
  );
  const courseOptions = assigned.map((course) => ({
    value: course.id,
    label: own(courseTitles, course.id) ?? course.id,
  }));
  const classLabel = (name: string, archived: boolean) =>
    archived ? t('filters.archivedClass', { name }) : name;
  const links = pageLinks({ classId: cls.id, courseId, cursor, trail }, page.nextCursor);

  return (
    <>
      {header}
      <AssessmentFilters
        action={getPathname({ href: ASSESSMENTS_PATH, locale })}
        classes={classes.map((item) => ({
          value: item.id,
          label: classLabel(item.name, item.archived),
        }))}
        classId={cls.id}
        courses={courseOptions}
        courseId={courseId}
      />
      {page.items.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck />}
          title={t('empty.noAttemptsTitle')}
          description={
            courseId === null
              ? t('empty.noAttemptsDescription')
              : t('empty.noAttemptsCourseDescription')
          }
        />
      ) : (
        <AttemptsTable
          attempts={page.items}
          courseTitles={courseTitles}
          showCourse={courseId === null}
          caption={t('list.caption', {
            className: classLabel(cls.name, cls.archived),
            course:
              courseId === null
                ? t('filters.allCourses')
                : (own(courseTitles, courseId) ?? t('list.unknownCourse')),
          })}
        />
      )}
      {(links.previousHref !== null || links.nextHref !== null) && (
        <Pagination className="mt-4" {...links} />
      )}
    </>
  );
}
