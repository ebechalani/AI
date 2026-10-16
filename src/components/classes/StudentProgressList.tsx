import { TrendingUp } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { StatusChip, useDateFormat } from '@/components/domain';
import { Card, Chip, EmptyState, LinkButton, ProgressBar } from '@/components/ui';
import { certificatePath, coursePath } from '@/components/teacher/paths';
import { rowStatus } from '@/components/teacher/reports-model';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import type { Course } from '@/types/content';
import type { Enrollment } from '@/types/learning';
import { enrollmentFacts } from './class-model';

export interface StudentProgressListProps {
  /** The student's enrollments in this class, newest activity first. */
  enrollments: Enrollment[];
  /** The courses the teacher may read (hidden ones are missing). */
  courses: Course[];
}

/** One card per course the student follows in this class. */
export function StudentProgressList({ enrollments, courses }: StudentProgressListProps) {
  const t = useTranslations('classes');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const formatDate = useDateFormat();
  const byId = new Map(courses.map((course) => [course.id, course]));

  return (
    <section aria-labelledby="student-progress-title" className="flex min-w-0 flex-col gap-4">
      <h2 id="student-progress-title" className="text-xl font-bold text-ink">
        {t('student.progress.title')}
      </h2>
      {enrollments.length === 0 ? (
        <EmptyState
          icon={<TrendingUp />}
          title={t('student.progress.empty.title')}
          description={t('student.progress.empty.description')}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {enrollments.map((enrollment) => {
            const course = byId.get(enrollment.courseId);
            const title = course
              ? pickTranslation(course.translations, locale, course.defaultLocale).title
              : t('student.progress.unavailable');
            const facts = enrollmentFacts(enrollment);
            // The class report's rule, so both pages give the same status.
            const status = rowStatus(enrollment);
            return (
              <Card as="article" key={enrollment.id} className="gap-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="min-w-0 text-base leading-snug font-semibold break-words text-ink">
                    {course ? (
                      <Link
                        href={coursePath(course.id)}
                        className="rounded-sm underline-offset-4 hover:text-brand-700 hover:underline"
                      >
                        {title}
                      </Link>
                    ) : (
                      title
                    )}
                  </h3>
                  {status === 'notStarted' ? (
                    <Chip>{t('student.progress.notStarted')}</Chip>
                  ) : (
                    <StatusChip status={status === 'completed' ? 'completed' : 'in_progress'} />
                  )}
                </div>
                <ProgressBar value={enrollment.progressPercent} label={title} showValue />
                <ul className="flex flex-col gap-1 text-sm text-ink-muted">
                  <li>
                    {t('student.progress.lessons', {
                      completed: enrollment.completedLessonCount,
                      total: Math.max(enrollment.totalLessonCount, enrollment.completedLessonCount),
                    })}
                  </li>
                  {facts.quizzesAttempted > 0 && (
                    <li>
                      {t('student.progress.quizzes', {
                        passed: facts.quizzesPassed,
                        attempted: facts.quizzesAttempted,
                      })}
                    </li>
                  )}
                  {facts.quizAveragePercent !== null && (
                    <li>
                      {t('student.progress.quizAverage', {
                        value: tCommon('units.percent', { value: facts.quizAveragePercent }),
                      })}
                    </li>
                  )}
                  {facts.projectsApproved + facts.projectsPending > 0 && (
                    <li>
                      {t('student.progress.projects', {
                        approved: facts.projectsApproved,
                        pending: facts.projectsPending,
                      })}
                    </li>
                  )}
                  <li>
                    {t('student.progress.lastActivity', {
                      date: formatDate(enrollment.lastActivityAt),
                    })}
                  </li>
                </ul>
                {enrollment.certificateId !== null && (
                  <div>
                    <LinkButton
                      href={certificatePath(enrollment.certificateId)}
                      size="sm"
                      variant="secondary"
                    >
                      {t('student.progress.certificate')}
                    </LinkButton>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
