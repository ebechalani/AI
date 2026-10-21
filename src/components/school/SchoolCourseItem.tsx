import { useLocale, useTranslations } from 'next-intl';
import { CertifiedBadge, StatusChip } from '@/components/domain';
import { Card, Chip } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import type { CourseUsageRow } from '@/types/analytics';
import type { Course } from '@/types/content';
import { schoolCoursePath } from './paths';

export interface SchoolCourseItemProps {
  course: Course;
  usage: CourseUsageRow | undefined;
  /** False for Teacher Academy courses: they are never assigned. */
  showUsage: boolean;
  authorName?: string | null;
  /** The status and visibility of a teacher-made course. */
  showStatus: boolean;
  titleAs: 'h3' | 'h4';
}

/** One course of the school's list: its chips, its facts and how much the classes use it. */
export function SchoolCourseItem({
  course,
  usage,
  showUsage,
  authorName,
  showStatus,
  titleAs: Title,
}: SchoolCourseItemProps) {
  const t = useTranslations('school');
  const tDomain = useTranslations('domain');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const title = pickTranslation(course.translations, locale, course.defaultLocale).title;
  const visibility =
    course.visibility === 'private' || course.visibility === 'school' ? course.visibility : null;

  return (
    <Card as="li" className="gap-2 p-4 sm:p-5">
      <Title className="text-base leading-snug font-semibold break-words text-ink">
        <Link
          href={schoolCoursePath(course.id)}
          className="rounded-sm underline-offset-4 hover:text-brand-700 hover:underline"
        >
          {title}
        </Link>
      </Title>
      <div className="flex flex-wrap gap-2">
        {course.isOfficial && <CertifiedBadge size="sm" />}
        {course.audience === 'teacher' && (
          <Chip size="sm" tone="accent">
            {tDomain('course.forTeachers')}
          </Chip>
        )}
        {course.accessTier === 'premium' && <Chip size="sm">{tDomain('course.premium')}</Chip>}
        {showStatus && <StatusChip status={course.status} size="sm" />}
        {showStatus && visibility !== null && (
          <Chip size="sm">{t(`courses.visibility.${visibility}`)}</Chip>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
        {authorName && <span>{t('courses.by', { name: authorName })}</span>}
        <span>{tDomain(`areas.${course.area}`)}</span>
        <span>{tDomain('course.lessons', { count: course.lessonCount })}</span>
      </div>
      {showUsage && (
        <p className="text-sm text-ink">
          {usage === undefined
            ? t('courses.usageNone')
            : t('courses.usage', {
                enrolled: usage.enrollments,
                completed: usage.completed,
                rate: tCommon('units.percent', { value: usage.completionRatePercent }),
              })}
        </p>
      )}
    </Card>
  );
}
