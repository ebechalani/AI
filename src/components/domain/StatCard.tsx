import { useLocale } from 'next-intl';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import { NamedIcon } from './NamedIcon';

const ICON_TONES = {
  default: 'bg-surface-muted text-ink-muted',
  brand: 'bg-brand-600 text-white',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
} as const;

export interface StatCardProps {
  label: string;
  /** A number is grouped for the locale ("1,250"); a string is printed as given. */
  value: string | number;
  /** A lucide-react icon name (see NamedIcon). */
  icon?: string;
  hint?: string;
  tone?: keyof typeof ICON_TONES;
  className?: string;
}

export function StatCard({ label, value, icon, hint, tone = 'default', className }: StatCardProps) {
  const locale = useLocale();
  const shown = typeof value === 'number' ? new Intl.NumberFormat(locale).format(value) : value;

  return (
    <Card tone={tone === 'brand' ? 'brand' : 'default'} className={cn('gap-3 p-5', className)}>
      {/* The text sits beside the icon while it has at least 5rem; in a card narrower than about
          180 px (ARCHITECTURE.md 7.4) it moves under the icon and takes the whole width. */}
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        {icon && (
          <span
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-control',
              ICON_TONES[tone],
            )}
          >
            <NamedIcon name={icon} className="size-5" />
          </span>
        )}
        <div className="flex min-w-0 flex-1 basis-20 flex-col gap-0.5">
          {/* A long word ("Progression", "d’évaluation") wraps inside the card, hyphenated in
              the page's language, instead of running into its padding. */}
          <p className="text-sm font-medium break-words hyphens-auto text-ink-muted">{label}</p>
          {/* Never broken inside a word: a number, or "50 %" with its no-break space, stays on one
              line; a value of several words ("Not passed", a date) wraps between them only. */}
          <p
            className={cn(
              'text-2xl leading-tight font-bold text-ink tabular-nums',
              typeof value === 'number' && 'whitespace-nowrap',
            )}
          >
            {shown}
          </p>
        </div>
      </div>
      {hint && <p className="text-sm text-ink-muted">{hint}</p>}
    </Card>
  );
}
