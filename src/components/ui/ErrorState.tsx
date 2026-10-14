import type { ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface ErrorStateProps {
  /** Default: the generic "Something went wrong" copy of the `errors` namespace. */
  title?: string;
  description?: string;
  /** Adds a "Try again" button (the `reset` of an `error.tsx`). Needs a client component. */
  onRetry?: () => void;
  /** Anything else to offer (a link home); rendered after the retry button. */
  action?: ReactNode;
  className?: string;
}

/** The full-area failure view of a page or a panel. A failed action uses `Alert` or a toast. */
export function ErrorState({ title, description, onRetry, action, className }: ErrorStateProps) {
  const t = useTranslations('errors');
  const body = description ?? (title === undefined ? t('page.description') : null);
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center px-6 py-10 text-center', className)}
    >
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-full bg-danger/10 text-danger"
      >
        <TriangleAlert className="size-7" />
      </span>
      <p className="mt-4 text-base font-semibold text-ink">{title ?? t('page.title')}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-ink-muted">{body}</p>}
      {(onRetry || action) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {onRetry && <Button onClick={onRetry}>{t('page.retry')}</Button>}
          {action}
        </div>
      )}
    </div>
  );
}
