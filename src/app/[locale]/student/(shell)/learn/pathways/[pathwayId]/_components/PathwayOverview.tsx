import { BookOpen, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { NamedIcon, useAgeRangeLabel } from '@/components/domain';
import { Card, Chip, ProgressBar } from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { cn } from '@/lib/utils';
import type { Pathway, PathwayAccent } from '@/types/content';
import { progressPercent } from './pathway-model';

// The tile colours of PathwayCard, written out in full so Tailwind generates them.
const ACCENTS: Record<PathwayAccent, string> = {
  violet: 'bg-violet-100 text-violet-700',
  cyan: 'bg-cyan-100 text-cyan-800',
  emerald: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
  rose: 'bg-rose-100 text-rose-700',
  blue: 'bg-blue-100 text-blue-700',
  slate: 'bg-slate-200 text-slate-700',
};

export interface PathwayOverviewProps {
  pathway: Pathway;
  /** Courses of the pathway the student is enrolled in. */
  enrolled: number;
  completed: number;
  /** Courses shown on the page. */
  total: number;
}

/** About the pathway: its description, topics, ages, and the student's progress once enrolled. */
export function PathwayOverview({ pathway, enrolled, completed, total }: PathwayOverviewProps) {
  const locale = useLocale();
  const t = useTranslations('learn');
  const tDomain = useTranslations('domain');
  const ageRange = useAgeRangeLabel()(pathway.ageMin, pathway.ageMax);
  const text = pickTranslation(pathway.translations, locale, pathway.defaultLocale);
  const topics = text.topics ?? [];

  return (
    <Card as="section" aria-labelledby="pathway-about" className="gap-6 p-5 sm:p-6">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-3 md:col-span-2">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-control',
                ACCENTS[pathway.accent] ?? ACCENTS.slate,
              )}
            >
              <NamedIcon name={pathway.icon} className="size-5" />
            </span>
            <h2 id="pathway-about" className="text-xl font-bold text-ink">
              {t('pathway.about')}
            </h2>
          </div>
          {text.description && (
            <p className="text-base break-words whitespace-pre-line text-ink-muted">
              {text.description}
            </p>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {(ageRange || total > 0) && (
            <ul className="flex flex-wrap gap-2">
              {ageRange && (
                <li className="max-w-full">
                  <Chip tone="brand" size="md" icon={<Users aria-hidden="true" />}>
                    {ageRange}
                  </Chip>
                </li>
              )}
              {/* Without courses, the empty state under the overview already says so. */}
              {total > 0 && (
                <li className="max-w-full">
                  <Chip size="md" icon={<BookOpen aria-hidden="true" />}>
                    {tDomain('pathway.courses', { count: total })}
                  </Chip>
                </li>
              )}
            </ul>
          )}
          {topics.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-ink">{t('pathway.topics')}</h3>
              <ul className="flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <li key={topic} className="max-w-full">
                    <Chip>{topic}</Chip>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {enrolled > 0 && total > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-5">
          <ProgressBar
            value={progressPercent(completed, total)}
            label={t('pathway.progressLabel')}
            showValue
          />
          <p className="text-sm font-medium text-ink">
            {t('pathway.progress', { completed, total })}
          </p>
        </div>
      )}
    </Card>
  );
}
