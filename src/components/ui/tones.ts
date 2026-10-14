// Class lists are written out in full: Tailwind finds utilities by scanning this text, so a
// class assembled from parts would never be generated.

export type StatusTone = 'info' | 'success' | 'warning' | 'danger';
export type ChipTone = 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger';

// The status colours reach only 4.1–4.4:1 as text on their own 10% tint, so text on a tint is
// the colour darkened by a fifth (5.7:1 or better).
export const DANGER_TEXT_ON_TINT = 'text-[color:color-mix(in_oklab,var(--color-danger)_80%,black)]';

export const TONE_SOFT: Record<ChipTone, string> = {
  neutral: 'bg-surface-muted text-ink-muted ring-1 ring-inset ring-border',
  brand: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200',
  accent: 'bg-accent-50 text-accent-800 ring-1 ring-inset ring-accent-200',
  success:
    'bg-success/10 text-[color:color-mix(in_oklab,var(--color-success)_80%,black)] ring-1 ring-inset ring-success/25',
  warning:
    'bg-warning/10 text-[color:color-mix(in_oklab,var(--color-warning)_80%,black)] ring-1 ring-inset ring-warning/25',
  danger: `bg-danger/10 ${DANGER_TEXT_ON_TINT} ring-1 ring-inset ring-danger/25`,
};

export const TONE_PANEL: Record<StatusTone, string> = {
  info: 'border-brand-200 bg-brand-50',
  success: 'border-success/30 bg-success/10',
  warning: 'border-warning/30 bg-warning/10',
  danger: 'border-danger/30 bg-danger/10',
};

export const TONE_ICON: Record<StatusTone, string> = {
  info: 'text-brand-600',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};
