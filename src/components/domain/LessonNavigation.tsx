import { Circle, CircleCheck, CirclePlay } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import type { Lesson, Module } from '@/types/content';
import { useDurationFormat } from './format';

export interface LessonNavigationProps {
  /** Sorted by `order`, as CourseOutline delivers them. */
  modules: Module[];
  lessons: Lesson[];
  currentLessonId: string;
  completedLessonIds: string[];
  /** Locale-less; a lesson's page is `${lessonBasePath}/${lesson.id}`. */
  lessonBasePath: string;
  className?: string;
}

/** The course outline of the lesson player: modules, their lessons, and what is done. */
export function LessonNavigation({
  modules,
  lessons,
  currentLessonId,
  completedLessonIds,
  lessonBasePath,
  className,
}: LessonNavigationProps) {
  const locale = useLocale();
  const t = useTranslations('domain');
  const formatDuration = useDurationFormat();
  const completed = new Set(completedLessonIds);

  return (
    <nav aria-label={t('lessonNav.label')} className={cn('flex flex-col gap-6', className)}>
      {modules.map((courseModule) => {
        const moduleLessons = lessons.filter((lesson) => lesson.moduleId === courseModule.id);
        const done = moduleLessons.filter((lesson) => completed.has(lesson.id)).length;
        const moduleText = pickTranslation(
          courseModule.translations,
          locale,
          courseModule.defaultLocale,
        );
        return (
          <section key={courseModule.id} className="flex flex-col gap-2">
            <div className="px-2">
              <h3 className="text-sm leading-snug font-semibold text-ink">{moduleText.title}</h3>
              <p className="mt-0.5 text-xs text-ink-muted">
                {t('lessonNav.moduleProgress', { completed: done, total: moduleLessons.length })}
              </p>
            </div>
            <ol className="flex flex-col gap-0.5">
              {moduleLessons.map((lesson) => {
                const isCurrent = lesson.id === currentLessonId;
                const isDone = completed.has(lesson.id);
                const Icon = isDone ? CircleCheck : isCurrent ? CirclePlay : Circle;
                const lessonText = pickTranslation(
                  lesson.translations,
                  locale,
                  lesson.defaultLocale,
                );
                return (
                  <li key={lesson.id}>
                    <Link
                      href={`${lessonBasePath}/${lesson.id}`}
                      aria-current={isCurrent ? 'page' : undefined}
                      className={cn(
                        'flex min-h-11 items-start gap-2.5 rounded-control px-2 py-2.5 text-sm transition-colors focus-visible:-outline-offset-2',
                        isCurrent
                          ? 'bg-brand-50 font-semibold text-brand-800'
                          : 'text-ink hover:bg-surface-muted',
                      )}
                    >
                      <Icon
                        aria-hidden="true"
                        className={cn(
                          'mt-0.5 size-4 shrink-0',
                          isDone ? 'text-success' : isCurrent ? 'text-brand-600' : 'text-ink-muted',
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block leading-snug">{lessonText.title}</span>
                        <span className="mt-0.5 block text-xs font-normal text-ink-muted">
                          {lesson.estimatedMinutes > 0 && formatDuration(lesson.estimatedMinutes)}
                          {isDone || isCurrent ? (
                            <>
                              {lesson.estimatedMinutes > 0 && <span aria-hidden="true"> · </span>}
                              {isDone ? t('lessonNav.completed') : t('lessonNav.current')}
                            </>
                          ) : (
                            <span className="sr-only"> {t('lessonNav.notCompleted')}</span>
                          )}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </nav>
  );
}
