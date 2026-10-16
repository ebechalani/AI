import { BookOpen, CircleCheck, Clock } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useDurationFormat } from '@/components/domain';
import { Card, Chip, EmptyState } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import type { Lesson, Module } from '@/types/content';
import { groupLessonsByModule, type LessonState } from './courses-model';
import { lessonPath } from './paths';

export interface CourseOutlineProps {
  courseId: string;
  modules: Module[];
  lessons: Lesson[];
  /** The teacher's own progress in an enrolled Teacher Academy course; null otherwise. */
  states: Map<string, LessonState> | null;
  /** Access allowed: lesson titles open the teacher player. */
  linked: boolean;
}

function LessonItem({
  courseId,
  lesson,
  state,
  linked,
}: {
  courseId: string;
  lesson: Lesson;
  state: LessonState | undefined;
  linked: boolean;
}) {
  const t = useTranslations('teacher');
  const locale = useLocale();
  const formatDuration = useDurationFormat();
  const title = pickTranslation(lesson.translations, locale, lesson.defaultLocale).title;
  const current = state === 'resume' || state === 'next';

  return (
    <li className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
      {state === 'completed' && (
        <span className="inline-flex shrink-0 text-success">
          <CircleCheck aria-hidden="true" className="size-5" />
          <span className="sr-only">{t('course.outline.completed')}</span>
        </span>
      )}
      <span className="min-w-0 flex-1 font-medium break-words text-ink">
        {linked ? (
          <Link
            href={lessonPath(courseId, lesson.id)}
            className="rounded-sm underline-offset-4 hover:text-brand-700 hover:underline"
          >
            {title}
          </Link>
        ) : (
          title
        )}
      </span>
      {current && (
        <Chip tone="brand" size="sm">
          {t('course.outline.current')}
        </Chip>
      )}
      {lesson.estimatedMinutes > 0 && (
        <span className="inline-flex items-center gap-1 text-sm text-ink-muted">
          <Clock aria-hidden="true" className="size-4 shrink-0" />
          {formatDuration(lesson.estimatedMinutes)}
        </span>
      )}
    </li>
  );
}

/** The modules and their lessons; the titles open the teacher player when access is allowed. */
export function CourseOutline({ courseId, modules, lessons, states, linked }: CourseOutlineProps) {
  const t = useTranslations('teacher');
  const locale = useLocale();
  const groups = groupLessonsByModule(modules, lessons);

  return (
    <section aria-labelledby="course-outline-title" className="flex min-w-0 flex-col gap-4">
      <h2 id="course-outline-title" className="text-xl font-bold text-ink">
        {t('course.outline.title')}
      </h2>
      {groups.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title={t('course.outline.empty.title')}
          description={t('course.outline.empty.description')}
        />
      ) : (
        groups.map(({ module, number, lessons: moduleLessons }) => {
          const text = pickTranslation(module.translations, locale, module.defaultLocale);
          return (
            <Card as="section" key={module.id} className="gap-2 p-5 sm:p-6">
              <h3 className="text-lg leading-snug font-bold break-words text-ink">
                {t('course.outline.module', { number, title: text.title })}
              </h3>
              <ol className="divide-y divide-border">
                {moduleLessons.map((lesson) => (
                  <LessonItem
                    key={lesson.id}
                    courseId={courseId}
                    lesson={lesson}
                    state={states?.get(lesson.id)}
                    linked={linked}
                  />
                ))}
              </ol>
            </Card>
          );
        })
      )}
    </section>
  );
}
