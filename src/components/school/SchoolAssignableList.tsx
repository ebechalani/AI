import { useLocale, useTranslations } from 'next-intl';
import { AssignCourseDialog } from '@/components/classes/AssignCourseDialog';
import { CertifiedBadge, useAgeRangeLabel, useDurationFormat } from '@/components/domain';
import { Card, Chip } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import type { Course } from '@/types/content';
import { schoolCoursePath } from './paths';

export interface AssignSection {
  key: string;
  title: string;
  description?: string;
  courses: Course[];
}

export interface SchoolAssignableListProps {
  classId: string;
  className: string;
  /** Only non-empty sections. */
  sections: AssignSection[];
  /** `cls.assignedCourseIds`. */
  assignedIds: string[];
}

function CourseRow({
  classId,
  className,
  course,
  assigned,
}: {
  classId: string;
  className: string;
  course: Course;
  assigned: boolean;
}) {
  const t = useTranslations('school');
  const tDomain = useTranslations('domain');
  const locale = useLocale();
  const formatDuration = useDurationFormat();
  const ageRange = useAgeRangeLabel()(course.ageMin, course.ageMax);
  const title = pickTranslation(course.translations, locale, course.defaultLocale).title;
  // `assign-course-` and `assign-section-` keep a course id and a pathway slug apart.
  const linkId = `assign-course-${course.id}`;

  return (
    <Card as="li" className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="min-w-0 text-base leading-snug font-semibold break-words text-ink">
            <Link
              id={linkId}
              href={schoolCoursePath(course.id)}
              className="rounded-sm underline-offset-4 hover:text-brand-700 hover:underline"
            >
              {title}
            </Link>
          </h3>
          {course.isOfficial && <CertifiedBadge size="sm" />}
          {course.accessTier === 'premium' && <Chip size="sm">{tDomain('course.premium')}</Chip>}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
          {ageRange && <span>{ageRange}</span>}
          <span>{tDomain('course.lessons', { count: course.lessonCount })}</span>
          {course.estimatedMinutes > 0 && <span>{formatDuration(course.estimatedMinutes)}</span>}
        </div>
      </div>
      <div className="shrink-0">
        {assigned ? (
          <Chip tone="success" size="md">
            {t('assign.assigned')}
          </Chip>
        ) : (
          <AssignCourseDialog
            classId={classId}
            className={className}
            courseId={course.id}
            courseTitle={title}
            mode="assign"
            currentDueAt={null}
            triggerLabel={t('assign.action')}
            triggerAriaLabel={t('assign.actionLabel', { course: title, className })}
            focusAfterSuccessId={linkId}
          />
        )}
      </div>
    </Card>
  );
}

/** The courses a class can take, by pathway, then the ones shared in the school. */
export function SchoolAssignableList({
  classId,
  className,
  sections,
  assignedIds,
}: SchoolAssignableListProps) {
  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => {
        const headingId = `assign-section-${section.key}-title`;
        return (
          <section key={section.key} aria-labelledby={headingId} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 id={headingId} className="text-xl font-bold break-words text-ink">
                {section.title}
              </h2>
              {section.description && (
                <p className="text-sm text-ink-muted">{section.description}</p>
              )}
            </div>
            <ul className="flex flex-col gap-3">
              {section.courses.map((course) => (
                <CourseRow
                  key={course.id}
                  classId={classId}
                  className={className}
                  course={course}
                  assigned={assignedIds.includes(course.id)}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
