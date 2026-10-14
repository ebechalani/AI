import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const SIZES = { sm: 'size-4', md: 'size-6', lg: 'size-9' } as const;

export type SpinnerSize = keyof typeof SIZES;

/** The bare, decorative glyph: for use inside something that already has a name (a button). */
export function SpinnerIcon({
  size = 'md',
  className,
}: {
  size?: SpinnerSize;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0', SIZES[size], className)}
    >
      {/* The group turns, not the svg: a turning square box sticks out of its own place at
          45°, which gives a page a horizontal scrollbar when the spinner sits at its edge. */}
      <g className="origin-center animate-spin">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export interface SpinnerProps {
  size?: SpinnerSize;
  /** Announced to screen readers; defaults to the shared "Loading…". */
  label?: string;
  className?: string;
}

export function Spinner({ size = 'md', label, className }: SpinnerProps) {
  const t = useTranslations('common');
  return (
    <span role="status" className={cn('inline-flex text-brand-600', className)}>
      <SpinnerIcon size={size} />
      <span className="sr-only">{label ?? t('labels.loading')}</span>
    </span>
  );
}
