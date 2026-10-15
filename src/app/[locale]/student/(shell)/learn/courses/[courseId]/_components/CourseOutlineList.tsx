import { BookOpen, Info } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, EmptyState } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import type { Lesson, Module } from '@/types/content';
import { groupLessonsByModule, type LessonState, type ModuleGroup } from './course-model';
import { LessonRow } from './LessonRow';

export interface CourseOutlineListProps {
  courseId: string;
  modules: Module[];
  lessons: Lesson[];
  states: ReadonlyMap<string, LessonState>;
  locked: boolean;
  enrolled: boolean;
}

function ModuleSection({
  courseId,
  group,
  states,
  locked,
  enrolled,
}: Omit<CourseOutlineListProps, 'modules' | 'lessons'> & { group: ModuleGroup }) {
  const locale = useLocale();
  const t = useTranslations('learn');
  const tDomain = useTranslations('domain');
  const { module, number, lessons } = group;
  const text = pickTranslation(module.translations, locale, module.defaultLocale);
  const headingId = `course-module-${module.id}`;
  const completed = lessons.filter((lesson) => states.get(lesson.id) === 'completed').length;

  return (
    <Card as="section" aria-labelledby={headingId} className="gap-4 p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 id={headingId} className="min-w-0 break-words text-ink">
            <span className="block text-xs font-semibold tracking-wide text-brand-700 uppercase">
              {t('course.module', { number })}
            </span>{' '}
            <span className="text-lg leading-snug font-bold">{text.title}</span>
          </h3>
          {enrolled && (
            <p className="text-sm font-medium text-ink-muted">
              {tDomain('lessonNav.moduleProgress', { completed, total: lessons.length })}
            </p>
          )}
        </div>
        {text.description && <p className="text-sm text-ink-muted">{text.description}</p>}
      </div>
      <ol className="-mx-3 flex flex-col gap-1">
        {lessons.map((lesson) => (
          <LessonRow
            key={lesson.id}
            courseId={courseId}
            lesson={lesson}
            state={states.get(lesson.id) ?? 'todo'}
            locked={locked}
          />
        ))}
      </ol>
    </Card>
  );
}

/** The modules and their lessons, each lesson with its state and a link to the player. */
export function CourseOutlineList({
  courseId,
  modules,
  lessons,
  states,
  locked,
  enrolled,
}: CourseOutlineListProps) {
  const t = useTranslations('learn');
  const groups = groupLessonsByModule(modules, lessons);

  return (
    <section aria-labelledby="course-outline" className="flex min-w-0 flex-col gap-4">
      <h2 id="course-outline" className="text-xl font-bold text-ink">
        {t('course.outline')}
      </h2>
      {groups.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title={t('course.noLessons.title')}
          description={t('course.noLessons.description')}
        />
      ) : (
        <>
          {!enrolled && !locked && (
            <p className="flex items-start gap-2 text-sm text-ink-muted">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-600" />
              {t('course.previewHint')}
            </p>
          )}
          {groups.map((group) => (
            <ModuleSection
              key={group.module.id}
              courseId={courseId}
              group={group}
              states={states}
              locked={locked}
              enrolled={enrolled}
            />
          ))}
        </>
      )}
    </section>
  );
}
