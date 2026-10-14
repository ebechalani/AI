import { useId } from 'react';
import { cn } from '@/lib/utils';

// The wordmark is artwork, not copy: it is the same in every language, and this component
// reads no message catalog so that a document without one (the global not-found page) can use it.
const BRAND_NAME = 'RoboHolic AI';

const MARK_SIZE = 32;
const WORD_X = 42;
// Width of "RoboHolic AI" at 20px/700 in Inter; textLength pins it for the fallback fonts.
const WORD_WIDTH = 124;

export interface LogoProps {
  /** `mark` is the square symbol alone (collapsed sidebars, small screens). */
  variant?: 'full' | 'mark';
  /** Rendered height in pixels; the width follows. */
  height?: number;
  /** `inverse` is for brand-coloured or dark backgrounds. */
  tone?: 'default' | 'inverse';
  /** Accessible name; pass `''` when a visible or link label next to it already names it. */
  label?: string;
  className?: string;
}

export function Logo({
  variant = 'full',
  height = 32,
  tone = 'default',
  label = BRAND_NAME,
  className,
}: LogoProps) {
  const gradientId = useId();
  const width = variant === 'full' ? WORD_X + WORD_WIDTH : MARK_SIZE;
  const inverse = tone === 'inverse';
  const glyph = inverse ? 'var(--color-brand-700)' : '#fff';

  return (
    <svg
      viewBox={`0 0 ${width} ${MARK_SIZE}`}
      width={(width / MARK_SIZE) * height}
      height={height}
      fill="none"
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      // The name is Latin: it keeps its direction inside right-to-left text.
      direction="ltr"
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--color-brand-500)" />
          <stop offset="1" stopColor="var(--color-accent-500)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={inverse ? '#fff' : `url(#${gradientId})`} />
      <path d="M16 11V7.5" stroke={glyph} strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="6.5" r="1.7" fill={glyph} />
      <rect x="6.5" y="11" width="19" height="13.5" rx="5" fill={glyph} />
      <circle cx="12.3" cy="17.5" r="2.1" fill={inverse ? '#fff' : 'var(--color-brand-600)'} />
      <circle cx="19.7" cy="17.5" r="2.1" fill={inverse ? '#fff' : 'var(--color-accent-600)'} />
      {variant === 'full' && (
        <text
          x={WORD_X}
          y="22.5"
          textLength={WORD_WIDTH}
          lengthAdjust="spacingAndGlyphs"
          fontSize="20"
          fontWeight="700"
          letterSpacing="-0.02em"
          fill={inverse ? '#fff' : 'var(--color-ink)'}
          aria-hidden="true"
        >
          RoboHolic
          <tspan fill={inverse ? '#fff' : 'var(--color-brand-600)'}> AI</tspan>
        </text>
      )}
    </svg>
  );
}
