import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const SIZES = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' } as const;

export function clampPercent(value: number): number {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0;
}

export interface ProgressBarProps {
  /** 0–100; out-of-range and fractional values are clamped and rounded. */
  value: number;
  /** What is progressing ("Course progress"). Without it the bar is named "N% complete". */
  label?: string;
  /** Prints the percentage after the bar. */
  showValue?: boolean;
  size?: keyof typeof SIZES;
  className?: string;
}

export function ProgressBar({
  value,
  label,
  showValue = false,
  size = 'md',
  className,
}: ProgressBarProps) {
  const t = useTranslations('common');
  const percent = clampPercent(value);
  const valueText = t('a11y.progress', { percent });

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        role="progressbar"
        aria-label={label ?? valueText}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={valueText}
        className={cn('min-w-0 flex-1 overflow-hidden rounded-full bg-brand-100', SIZES[size])}
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-brand-600 to-accent-600 transition-[width] duration-500 rtl:bg-linear-to-l"
          style={{ width: `${percent}%` }}
        />
      </div>
      {showValue && (
        <span aria-hidden="true" className="shrink-0 text-sm font-semibold text-ink tabular-nums">
          {t('units.percent', { value: percent })}
        </span>
      )}
    </div>
  );
}
