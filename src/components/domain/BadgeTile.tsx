import { Lock } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { pickTranslation } from '@/lib/i18n/content';
import { cn } from '@/lib/utils';
import type { IsoDateString } from '@/types/common';
import type { Badge, BadgeTier } from '@/types/gamification';
import { useDateFormat } from './format';
import { NamedIcon } from './NamedIcon';

const TIERS: Record<BadgeTier, string> = {
  bronze: 'bg-orange-100 text-orange-800 ring-orange-300',
  silver: 'bg-slate-100 text-slate-700 ring-slate-300',
  gold: 'bg-amber-100 text-amber-800 ring-amber-400',
};

export interface BadgeTileProps {
  badge: Badge;
  /** When the viewer earned it; null or absent draws the badge as not earned yet. */
  earnedAt?: IsoDateString | null;
  className?: string;
}

export function BadgeTile({ badge, earnedAt, className }: BadgeTileProps) {
  const locale = useLocale();
  const t = useTranslations('domain');
  const formatDate = useDateFormat();
  const text = pickTranslation(badge.translations, locale, badge.defaultLocale);
  const earned = earnedAt != null;

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col items-center gap-3 rounded-card border p-5 text-center',
        earned ? 'border-border bg-surface shadow-card' : 'border-dashed border-ink-muted/40',
        className,
      )}
    >
      <span
        className={cn(
          'relative flex size-16 items-center justify-center rounded-full ring-2 ring-inset',
          earned ? TIERS[badge.tier] : 'bg-surface-muted text-ink-muted ring-border',
        )}
      >
        <NamedIcon name={badge.icon} className="size-7" />
        {!earned && (
          <span className="absolute -inset-e-1 -bottom-1 flex size-6 items-center justify-center rounded-full border border-border bg-surface text-ink-muted">
            <Lock aria-hidden="true" className="size-3.5" />
          </span>
        )}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-sm leading-snug font-semibold break-words text-ink">{text.name}</p>
        <p className="text-xs font-medium text-ink-muted">{t(`badge.tiers.${badge.tier}`)}</p>
        {text.description && <p className="text-sm text-ink-muted">{text.description}</p>}
      </div>
      <p className={cn('mt-auto text-xs font-medium', earned ? 'text-success' : 'text-ink-muted')}>
        {earned ? t('badge.earnedOn', { date: formatDate(earnedAt) }) : t('badge.locked')}
      </p>
    </div>
  );
}
