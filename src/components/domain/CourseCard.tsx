import { BookOpen, Clock, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, Chip, ProgressBar } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import type { LearningArea } from '@/types/common';
import type { Course } from '@/types/content';
import { CertifiedBadge } from './CertifiedBadge';
import { useAgeRangeLabel, useDurationFormat } from './format';
import { MediaImage } from './MediaImage';
import { NamedIcon } from './NamedIcon';

// A course without a cover image shows its learning area instead.
const AREA_ICONS: Record<LearningArea, string> = {
  ai: 'Brain',
  generative_ai: 'Sparkles',
  coding: 'CodeXml',
  robotics: 'Bot',
  creativity: 'Palette',
  innovation: 'Lightbulb',
  responsible_ai: 'ShieldCheck',
};

export interface CourseCardProps {
  course: Course;
  /** Locale-less path. */
  href: string;
  /** Shows a progress bar when given (the viewer is enrolled). */
  progressPercent?: number;
  className?: string;
}

export function CourseCard({ course, href, progressPercent, className }: CourseCardProps) {
  const locale = useLocale();
  const t = useTranslations('domain');
  const formatDuration = useDurationFormat();
  const ageRange = useAgeRangeLabel()(course.ageMin, course.ageMax);
  const text = pickTranslation(course.translations, locale, course.defaultLocale);

  return (
    <Card as="article" interactive className={cn('h-full', className)}>
      {course.coverImage ? (
        <MediaImage
          media={course.coverImage}
          alt=""
          frame="16:9"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="rounded-t-card"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex aspect-video items-center justify-center rounded-t-card bg-linear-to-br from-brand-100 via-brand-50 to-accent-100 text-brand-600"
        >
          <NamedIcon name={AREA_ICONS[course.area]} className="size-12" strokeWidth={1.5} />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="brand">{t(`areas.${course.area}`)}</Chip>
          {course.isOfficial && <CertifiedBadge />}
          {course.accessTier === 'premium' && <Chip tone="warning">{t('course.premium')}</Chip>}
          {course.audience === 'teacher' && <Chip tone="accent">{t('course.forTeachers')}</Chip>}
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-base leading-snug font-semibold text-ink">
            {/* The link covers the whole card; the card is its positioning parent. */}
            <Link
              href={href}
              className="rounded-sm after:absolute after:inset-0 after:rounded-card"
            >
              {text.title}
            </Link>
          </h3>
          {text.summary && <p className="line-clamp-2 text-sm text-ink-muted">{text.summary}</p>}
        </div>

        <ul className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-1 text-sm text-ink-muted">
          <li className="flex items-center gap-1.5">
            <BookOpen aria-hidden="true" className="size-4 shrink-0" />
            {t('course.lessons', { count: course.lessonCount })}
          </li>
          {course.estimatedMinutes > 0 && (
            <li className="flex items-center gap-1.5">
              <Clock aria-hidden="true" className="size-4 shrink-0" />
              {formatDuration(course.estimatedMinutes)}
            </li>
          )}
          {ageRange && (
            <li className="flex items-center gap-1.5">
              <Users aria-hidden="true" className="size-4 shrink-0" />
              {ageRange}
            </li>
          )}
        </ul>

        {progressPercent !== undefined && (
          <ProgressBar value={progressPercent} label={text.title} size="sm" showValue />
        )}
      </div>
    </Card>
  );
}
