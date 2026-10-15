import { Circle, CircleCheck, CirclePlay, Clock, Lock } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useDurationFormat } from '@/components/domain';
import { Chip } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import type { Lesson } from '@/types/content';
import { lessonHref, type LessonState } from './course-model';

export interface LessonRowProps {
  courseId: string;
  lesson: Lesson;
  state: LessonState;
  /** Licence missing: the title is plain text, not a link. */
  locked: boolean;
}

function StateIcon({ state, locked }: { state: LessonState; locked: boolean }) {
  const shared = 'mt-0.5 size-5 shrink-0';
  if (locked) return <Lock aria-hidden="true" className={cn(shared, 'text-ink-muted')} />;
  if (state === 'completed') {
    return <CircleCheck aria-hidden="true" className={cn(shared, 'text-success')} />;
  }
  if (state === 'resume') {
    return <CirclePlay aria-hidden="true" className={cn(shared, 'text-brand-600')} />;
  }
  return <Circle aria-hidden="true" className={cn(shared, 'text-ink-muted')} />;
}

/** One lesson of the outline: its state, title (a link unless locked), summary and meta. */
export function LessonRow({ courseId, lesson, state, locked }: LessonRowProps) {
  const locale = useLocale();
  const t = useTranslations('learn');
  const tDomain = useTranslations('domain');
  const formatDuration = useDurationFormat();
  const text = pickTranslation(lesson.translations, locale, lesson.defaultLocale);

  const stateLabel = locked
    ? t('course.lessonLocked')
    : state === 'completed'
      ? tDomain('status.completed')
      : state === 'resume'
        ? t('course.lessonResume')
        : null;
  const srState = stateLabel && (
    <>
      {' '}
      <span className="sr-only">({stateLabel})</span>
    </>
  );

  return (
    <li
      className={cn(
        'flex min-h-11 items-start gap-3 rounded-control px-3 py-3',
        state === 'resume' && !locked && 'bg-brand-50',
      )}
    >
      <StateIcon state={state} locked={locked} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-semibold break-words text-ink">
          {locked ? (
            <span>
              {text.title}
              {srState}
            </span>
          ) : (
            <Link
              href={lessonHref(courseId, lesson.id)}
              className="rounded-sm underline-offset-4 hover:text-brand-700 hover:underline"
            >
              {text.title}
              {srState}
            </Link>
          )}
        </p>
        {text.summary && <p className="line-clamp-2 text-sm text-ink-muted">{text.summary}</p>}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
          {lesson.estimatedMinutes > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden="true" className="size-4 shrink-0" />
              {formatDuration(lesson.estimatedMinutes)}
            </span>
          )}
          {lesson.xpReward > 0 && (
            <span className="font-semibold text-brand-700">
              {t('course.lessonXp', { xp: lesson.xpReward })}
            </span>
          )}
          {lesson.quizIds.length > 0 && <Chip tone="accent">{t('course.lessonQuiz')}</Chip>}
          {lesson.projectIds.length > 0 && <Chip tone="brand">{t('course.lessonProject')}</Chip>}
        </div>
      </div>
    </li>
  );
}
