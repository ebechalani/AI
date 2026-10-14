import { Award, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/ui';
import { cn } from '@/lib/utils';
import { LESSON_STAGES } from '@/types/content';

// The nine steps of a lesson (ARCHITECTURE.md 7.6): the eight block stages, then the completion panel.
const FLOW = [...LESSON_STAGES, 'earn'] as const;
const CURRENT_STAGE: (typeof FLOW)[number] = 'build';
const PREVIEW_LESSON = { current: 3, total: 8 };

/**
 * A still of the lesson player, built from the real design language rather than a screenshot:
 * progress, the nine steps, a build task, a hint from Robo AI and what the lesson earns.
 * Illustrative copy only; every word comes from the catalog.
 */
export function HeroPreview() {
  const t = useTranslations('home');
  const tDomain = useTranslations('domain');
  const percent = Math.round(((PREVIEW_LESSON.current - 1) / PREVIEW_LESSON.total) * 100);

  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="absolute -inset-6 rounded-[2rem] bg-linear-to-br from-brand-300/50 via-accent-200/40 to-transparent blur-2xl" />
      <div className="relative flex flex-col gap-5 rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
            {t('hero.preview.label')}
          </p>
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-[color:color-mix(in_oklab,var(--color-success)_80%,black)]">
            <Zap className="size-3.5" />
            {t('hero.preview.xp')}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-ink">{t('hero.preview.progress', PREVIEW_LESSON)}</span>
            <span className="text-ink-muted tabular-nums">{percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-brand-100">
            <div
              className="h-full rounded-full bg-linear-to-r from-brand-600 to-accent-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <ol className="flex flex-wrap gap-1.5">
          {FLOW.map((stage) => (
            <li
              key={stage}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-semibold',
                stage === CURRENT_STAGE
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-muted text-ink-muted ring-1 ring-border ring-inset',
              )}
            >
              {tDomain(`stages.${stage}`)}
            </li>
          ))}
        </ol>

        <div className="rounded-control border border-border bg-surface-muted p-4">
          <p className="text-xs font-semibold tracking-wider text-brand-700 uppercase">
            {t('hero.preview.stageLabel')}: {tDomain(`stages.${CURRENT_STAGE}`)}
          </p>
          <p className="mt-1.5 text-sm font-medium text-ink">{t('hero.preview.task')}</p>
        </div>

        <div className="flex items-start gap-3 rounded-control bg-brand-50 p-4">
          <Avatar avatarId="robot" size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-brand-700">{t('hero.preview.tutorName')}</p>
            <p className="mt-0.5 text-sm text-ink">{t('hero.preview.tutorHint')}</p>
          </div>
        </div>

        <p className="flex items-center gap-2 text-sm font-medium text-ink">
          <Award className="size-5 shrink-0 text-warning" />
          {t('hero.preview.badge')}
        </p>
      </div>
    </div>
  );
}
