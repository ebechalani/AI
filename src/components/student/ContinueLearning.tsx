import { ArrowRight, Rocket } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { ProgressCard } from '@/components/domain';
import { EmptyState, LinkButton } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { cn } from '@/lib/utils';
import type { ContinueItem } from './home-model';

export interface ContinueLearningProps {
  items: readonly ContinueItem[];
}

/** The enrolled courses, most recent first, each with the way back in. */
export function ContinueLearning({ items }: ContinueLearningProps) {
  const t = useTranslations('student');
  const locale = useLocale();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Rocket />}
        title={t('continue.empty.title')}
        description={t('continue.empty.description')}
        action={
          <LinkButton href="/student/learn">
            {t('continue.empty.action')}
            <ArrowRight aria-hidden="true" className="rtl:rotate-180" />
          </LinkButton>
        }
      />
    );
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {items.map(({ enrollment, course, target }, index) => {
        const { title } = pickTranslation(course.translations, locale, course.defaultLocale);
        const subtitle =
          target.kind === 'review'
            ? t('continue.completed')
            : t('continue.lessons', {
                completed: enrollment.completedLessonCount,
                total: Math.max(course.lessonCount, enrollment.completedLessonCount),
              });
        return (
          <li key={enrollment.id} className={cn('min-w-0', index === 0 && 'md:col-span-2')}>
            <ProgressCard
              title={title}
              subtitle={subtitle}
              percent={enrollment.progressPercent}
              href={target.href}
              ctaLabel={t(`continue.${target.kind}`)}
              className="h-full"
            />
          </li>
        );
      })}
    </ul>
  );
}
