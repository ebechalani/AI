import { useLocale, useTranslations } from 'next-intl';
import { StatusChip, useDateFormat } from '@/components/domain';
import { Card, LinkButton } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import type { Course } from '@/types/content';
import { coursePath, editCoursePath } from './paths';

export interface MyCoursesListProps {
  /** The teacher's own courses, every status, latest change first. */
  courses: Course[];
}

export function MyCoursesList({ courses }: MyCoursesListProps) {
  const t = useTranslations('teacher');
  const locale = useLocale();
  const formatDate = useDateFormat();

  return (
    <ul className="flex flex-col gap-3">
      {courses.map((course) => {
        const title = pickTranslation(course.translations, locale, course.defaultLocale).title;
        return (
          <Card
            as="li"
            key={course.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 flex-col gap-1.5">
              <h3 className="text-base leading-snug font-semibold break-words text-ink">
                <Link
                  href={coursePath(course.id)}
                  className="rounded-sm underline-offset-4 hover:text-brand-700 hover:underline"
                >
                  {title}
                </Link>
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                <StatusChip status={course.status} />
                <span>{t(`courses.mine.audience.${course.audience}`)}</span>
                <span>{t('courses.mine.updated', { date: formatDate(course.updatedAt) })}</span>
              </div>
            </div>
            <div className="shrink-0">
              <LinkButton
                href={editCoursePath(course.id)}
                size="sm"
                variant="secondary"
                aria-label={t('courses.mine.editLabel', { course: title })}
              >
                {t('courses.mine.edit')}
              </LinkButton>
            </div>
          </Card>
        );
      })}
    </ul>
  );
}
