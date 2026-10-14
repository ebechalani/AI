import { useTranslations } from 'next-intl';
import { ProgressBar } from '@/components/ui';
import { levelProgress, MAX_LEVEL } from '@/lib/gamification/levels';
import { cn } from '@/lib/utils';

export interface LevelProgressProps {
  xp: number;
  className?: string;
}

/** The current level, the XP total, and how far the next level is. */
export function LevelProgress({ xp, className }: LevelProgressProps) {
  const t = useTranslations('domain');
  const { level, nextLevelXp, percent } = levelProgress(xp);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-lg font-semibold text-ink">{t('level.label', { level })}</p>
        <p className="text-sm font-semibold text-brand-700 tabular-nums">
          {t('xp.amount', { xp })}
        </p>
      </div>
      <ProgressBar value={percent} label={t('level.progress')} />
      <p className="text-sm text-ink-muted">
        {level >= MAX_LEVEL
          ? t('level.max')
          : t('level.toNext', { xp: Math.max(0, nextLevelXp - xp), level: level + 1 })}
      </p>
    </div>
  );
}
