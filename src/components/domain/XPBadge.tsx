import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: { pill: 'min-h-8 gap-1.5 ps-1 pe-2.5 text-xs', level: 'size-6 text-xs' },
  md: { pill: 'min-h-10 gap-2 ps-1.5 pe-3.5 text-sm', level: 'size-7 text-sm' },
  lg: { pill: 'min-h-12 gap-2.5 ps-2 pe-5 text-base', level: 'size-9 text-base' },
} as const;

export interface XPBadgeProps {
  xp: number;
  level: number;
  size?: keyof typeof SIZES;
  className?: string;
}

/** The level in a disc and the XP total next to it; read out as "Level 3, 620 XP". */
export function XPBadge({ xp, level, size = 'md', className }: XPBadgeProps) {
  const t = useTranslations('domain');
  const summary = t('xp.summary', { level, xp });
  return (
    <span
      title={summary}
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border border-brand-200 bg-brand-50 font-semibold whitespace-nowrap text-brand-800 tabular-nums',
        SIZES[size].pill,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex items-center justify-center rounded-full bg-linear-to-br from-brand-600 to-accent-700 font-bold text-white',
          SIZES[size].level,
        )}
      >
        {level}
      </span>
      <span aria-hidden="true">{t('xp.amount', { xp })}</span>
      <span className="sr-only">{summary}</span>
    </span>
  );
}
