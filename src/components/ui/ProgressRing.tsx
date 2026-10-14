import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { clampPercent } from './ProgressBar';

export interface ProgressRingProps {
  /** 0–100; out-of-range and fractional values are clamped and rounded. */
  value: number;
  /** Diameter in pixels. */
  size?: number;
  strokeWidth?: number;
  /** What is progressing. Without it the ring is named "N% complete". */
  label?: string;
  /** Replaces the percentage in the middle (a level number, an icon). */
  children?: ReactNode;
  className?: string;
}

export function ProgressRing({
  value,
  size = 72,
  strokeWidth = 7,
  label,
  children,
  className,
}: ProgressRingProps) {
  const t = useTranslations('common');
  const percent = clampPercent(value);
  const valueText = t('a11y.progress', { percent });
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      role="progressbar"
      aria-label={label ?? valueText}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={valueText}
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        aria-hidden="true"
        className="absolute inset-0 size-full -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-brand-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          className="stroke-brand-600 transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span
        aria-hidden={children === undefined ? true : undefined}
        className="relative font-semibold text-ink tabular-nums"
        style={{ fontSize: Math.max(11, Math.round(size * 0.24)) }}
      >
        {children ?? t('units.percent', { value: percent })}
      </span>
    </div>
  );
}
