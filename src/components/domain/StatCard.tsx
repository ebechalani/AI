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
      <div className="flex items-start gap-4">
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
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-sm font-medium text-ink-muted">{label}</p>
          <p className="text-2xl leading-tight font-bold break-words text-ink tabular-nums">
            {shown}
          </p>
        </div>
      </div>
      {hint && <p className="text-sm text-ink-muted">{hint}</p>}
    </Card>
  );
}
