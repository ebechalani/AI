import { useLocale, useTranslations } from 'next-intl';
import { Card, Chip, ProgressBar } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import type { Pathway, PathwayAccent } from '@/types/content';
import { useAgeRangeLabel } from './format';
import { NamedIcon } from './NamedIcon';

// Each pair is at least 4.5:1 (icon on tile). Written out in full so Tailwind generates them.
const ACCENTS: Record<PathwayAccent, string> = {
  violet: 'bg-violet-100 text-violet-700',
  cyan: 'bg-cyan-100 text-cyan-800',
  emerald: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
  rose: 'bg-rose-100 text-rose-700',
  blue: 'bg-blue-100 text-blue-700',
  slate: 'bg-slate-200 text-slate-700',
};

const MAX_TOPICS = 3;

export interface PathwayCardProps {
  pathway: Pathway;
  /** Locale-less path. */
  href: string;
  /** The viewer's completed courses out of the pathway's courses. */
  progress?: { completed: number; total: number };
  className?: string;
}

export function PathwayCard({ pathway, href, progress, className }: PathwayCardProps) {
  const locale = useLocale();
  const t = useTranslations('domain');
  const ageRange = useAgeRangeLabel()(pathway.ageMin, pathway.ageMax);
  const text = pickTranslation(pathway.translations, locale, pathway.defaultLocale);
  const topics = (text.topics ?? []).slice(0, MAX_TOPICS);

  return (
    <Card as="article" interactive className={cn('h-full gap-4 p-5 sm:p-6', className)}>
      <div className="flex items-start gap-4">
        <span
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-control',
            ACCENTS[pathway.accent] ?? ACCENTS.slate,
          )}
        >
          <NamedIcon name={pathway.icon} className="size-6" />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg leading-snug font-semibold text-ink">
            <Link
              href={href}
              className="rounded-sm after:absolute after:inset-0 after:rounded-card"
            >
              {text.title}
            </Link>
          </h3>
          {text.tagline && <p className="mt-1 text-sm text-ink-muted">{text.tagline}</p>}
        </div>
      </div>

      {topics.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <li key={topic} className="max-w-full">
              <Chip>{topic}</Chip>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-col gap-3">
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-ink-muted">
          <span>{t('pathway.courses', { count: pathway.publishedCourseCount })}</span>
          {pathway.audience === 'teacher' ? (
            <span>{t('course.forTeachers')}</span>
          ) : (
            ageRange && <span>{ageRange}</span>
          )}
        </p>
        {progress && progress.total > 0 && (
          <div className="flex flex-col gap-1.5">
            <ProgressBar
              value={(progress.completed / progress.total) * 100}
              label={text.title}
              size="sm"
            />
            <p className="text-sm font-medium text-ink">
              {t('pathway.progress', { completed: progress.completed, total: progress.total })}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
