import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  /** An icon element (`<Trophy />`); it is decorative. Defaults to an inbox. */
  icon?: ReactNode;
  /** Default: the generic "Nothing here yet" copy of the `errors` namespace. */
  title?: string;
  description?: string;
  /** Usually one `Button` or `LinkButton`: the way out of the empty state. */
  action?: ReactNode;
  /** `plain` drops the dashed frame, for use inside a card. */
  variant?: 'framed' | 'plain';
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'framed',
  className,
}: EmptyStateProps) {
  const t = useTranslations('errors');
  // The default description belongs to the default title; a custom title stands alone.
  const body = description ?? (title === undefined ? t('empty.description') : null);
  return (
    <div
      className={cn(
        'flex flex-col items-center px-6 py-10 text-center',
        variant === 'framed' &&
          'rounded-card border border-dashed border-ink-muted/40 bg-surface-muted/50',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-full bg-brand-100 text-brand-600 [&>svg]:size-7"
      >
        {icon ?? <Inbox />}
      </span>
      <p className="mt-4 text-base font-semibold text-ink">{title ?? t('empty.title')}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-ink-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
