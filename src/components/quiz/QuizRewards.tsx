import { TrendingUp, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BadgeTile } from '@/components/domain';
import type { IsoDateString } from '@/types/common';
import type { RewardView } from './quiz-model';

export interface QuizRewardsProps {
  view: RewardView;
  /** When the attempt was sent: the date on the new badges. */
  earnedAt: IsoDateString;
}

/** What a passed attempt earned: XP, a new level, new badges, or why there is nothing new. */
export function QuizRewards({ view, earnedAt }: QuizRewardsProps) {
  const t = useTranslations('quiz');
  const level = view.leveledUp ? view.level : null;
  const banner = view.xp > 0 || level !== null || view.note !== null;
  if (!banner && view.badges.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {banner && (
        <div className="flex flex-col items-center gap-2 rounded-card bg-linear-to-br from-brand-50 via-surface to-accent-50 px-4 py-5 text-center">
          {view.xp > 0 && (
            <p className="inline-flex items-center gap-2 text-2xl font-bold text-brand-700 tabular-nums">
              <Zap aria-hidden="true" className="size-6 shrink-0" />
              {t('result.xp', { xp: view.xp })}
            </p>
          )}
          {level !== null && (
            <p className="inline-flex items-center gap-1.5 font-semibold text-ink">
              <TrendingUp aria-hidden="true" className="size-5 shrink-0 text-success" />
              {t('result.levelUp', { level })}
            </p>
          )}
          {view.note !== null && (
            <p className="text-ink">
              {view.note === 'pending' ? t('result.pending') : t('result.alreadyEarned')}
            </p>
          )}
        </div>
      )}
      {view.badges.length > 0 && (
        <div className="flex flex-col gap-3">
          <h5 className="font-semibold text-ink">{t('result.badges')}</h5>
          <ul className="grid grid-cols-2 gap-3">
            {view.badges.map((badge) => (
              <li key={badge.id} className="min-w-0">
                <BadgeTile badge={badge} earnedAt={earnedAt} className="h-full" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
