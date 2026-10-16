import { BookOpen, Plus } from 'lucide-react';
import { useLocale, useTimeZone, useTranslations } from 'next-intl';
import { CertifiedBadge, useDateFormat } from '@/components/domain';
import { Card, Chip, EmptyState, LinkButton } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import { formatDate as formatDateIn } from '@/lib/utils';
import type { IsoDateString } from '@/types/common';
import { assignPath, coursePath, reportPath } from '@/components/teacher/paths';
import { AssignCourseDialog } from './AssignCourseDialog';
import { DUE_DATE_TIME_ZONE, isOverdue, type AssignedCourseRow } from './class-model';
import { UnassignCourseButton } from './UnassignCourseButton';

export interface AssignedCoursesProps {
  classId: string;
  className: string;
  rows: AssignedCourseRow[];
  now: IsoDateString;
  /** An archived class: no assign, due-date or unassign controls. */
  readOnly: boolean;
}

/** The courses assigned to the class, with their due dates, reports and controls. */
export function AssignedCourses({ classId, className, rows, now, readOnly }: AssignedCoursesProps) {
  const t = useTranslations('classes');
  const locale = useLocale();
  const timeZone = useTimeZone();
  const formatDate = useDateFormat();

  const assignLink = readOnly ? undefined : (
    <LinkButton href={assignPath(classId)} size="sm">
      <Plus aria-hidden="true" />
      {t('courses.assign')}
    </LinkButton>
  );

  return (
    <section aria-labelledby="assigned-courses-title" className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="assigned-courses-title"
          tabIndex={-1}
          className="rounded-sm text-xl font-bold text-ink"
        >
          {t('courses.title')}
        </h2>
        {rows.length > 0 && assignLink}
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title={t('courses.empty.title')}
          description={
            readOnly ? t('courses.empty.descriptionArchived') : t('courses.empty.description')
          }
          action={assignLink}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map(({ assignment, course }) => {
            const title =
              course === null
                ? t('courses.unavailable')
                : pickTranslation(course.translations, locale, course.defaultLocale).title;
            return (
              <Card as="li" key={assignment.id} className="gap-3 p-4 sm:p-5">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="min-w-0 text-base leading-snug font-semibold break-words text-ink">
                      {course === null ? (
                        title
                      ) : (
                        <Link
                          href={coursePath(course.id)}
                          className="rounded-sm underline-offset-4 hover:text-brand-700 hover:underline"
                        >
                          {title}
                        </Link>
                      )}
                    </h3>
                    {course?.isOfficial && <CertifiedBadge size="sm" />}
                  </div>
                  {course === null && (
                    <p className="text-sm text-ink-muted">{t('courses.unavailableHint')}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
                  {assignment.dueAt === null ? (
                    <span>{t('courses.noDue')}</span>
                  ) : (
                    <span className="inline-flex flex-wrap items-center gap-2">
                      {t('courses.due', {
                        date: formatDateIn(assignment.dueAt, locale, 'date', DUE_DATE_TIME_ZONE),
                      })}
                      {isOverdue(assignment.dueAt, now, timeZone) && (
                        <Chip tone="warning" size="sm">
                          {t('courses.overdue')}
                        </Chip>
                      )}
                    </span>
                  )}
                  <span>{t('courses.assignedOn', { date: formatDate(assignment.assignedAt) })}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {course !== null && (
                    <LinkButton
                      href={reportPath(classId, course.id)}
                      size="sm"
                      variant="secondary"
                      // The page has one "Progress report" link per course and one for the class.
                      aria-label={t('courses.reportLabel', { course: title })}
                    >
                      {t('courses.report')}
                    </LinkButton>
                  )}
                  {!readOnly && course !== null && (
                    <AssignCourseDialog
                      classId={classId}
                      className={className}
                      courseId={course.id}
                      courseTitle={title}
                      mode="dueDate"
                      currentDueAt={assignment.dueAt}
                      triggerLabel={t('courses.dueDateAction')}
                      triggerAriaLabel={t('courses.dueDateActionLabel', { course: title })}
                    />
                  )}
                  {!readOnly && (
                    <UnassignCourseButton
                      classId={classId}
                      className={className}
                      courseId={assignment.courseId}
                      courseTitle={title}
                    />
                  )}
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </section>
  );
}
