import { BookOpen } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useDurationFormat } from '@/components/domain';
import { Card, EmptyState } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import type { Lesson, Module } from '@/types/content';
import { groupLessons } from './course-admin-model';
import { previewLessonPath } from './paths';

export interface CourseOutlinePreviewProps {
  courseId: string;
  modules: Module[];
  lessons: Lesson[];
  /** The admin may open the course: each lesson links to the read-only preview. */
  linked: boolean;
}

/** The course's modules and lessons, each lesson opening WS-B's read-only player. */
export function CourseOutlinePreview({
  courseId,
  modules,
  lessons,
  linked,
}: CourseOutlinePreviewProps) {
  const t = useTranslations('school');
  const locale = useLocale();
  const formatDuration = useDurationFormat();
  const groups = groupLessons(modules, lessons).filter((group) => group.lessons.length > 0);

  return (
    <section aria-labelledby="outline-title" className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="outline-title" className="text-xl font-bold text-ink">
          {t('course.outlineTitle')}
        </h2>
        {linked && groups.length > 0 && (
          <p className="text-sm text-ink-muted">{t('course.outlineDescription')}</p>
        )}
      </div>
      {groups.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title={t('course.noLessons.title')}
          description={t('course.noLessons.description')}
        />
      ) : (
        groups.map((group, index) => (
          <Card key={group.module?.id ?? `other-${index}`} className="gap-3 p-5 sm:p-6">
            <h3 className="text-lg leading-snug font-semibold break-words text-ink">
              {group.module === null
                ? t('course.otherLessons')
                : pickTranslation(
                    group.module.translations,
                    locale,
                    group.module.defaultLocale,
                  ).title}
            </h3>
            <ol className="flex flex-col divide-y divide-border">
              {group.lessons.map((lesson) => {
                const title = pickTranslation(
                  lesson.translations,
                  locale,
                  lesson.defaultLocale,
                ).title;
                return (
                  <li
                    key={lesson.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0"
                  >
                    {linked ? (
                      <Link
                        href={previewLessonPath(courseId, lesson.id)}
                        aria-label={t('course.previewLabel', { lesson: title })}
                        className="min-w-0 rounded-sm font-medium break-words text-ink underline-offset-4 hover:text-brand-700 hover:underline"
                      >
                        {title}
                      </Link>
                    ) : (
                      <span className="min-w-0 font-medium break-words text-ink">{title}</span>
                    )}
                    {lesson.estimatedMinutes > 0 && (
                      <span className="text-sm whitespace-nowrap text-ink-muted">
                        {formatDuration(lesson.estimatedMinutes)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </Card>
        ))
      )}
    </section>
  );
}
