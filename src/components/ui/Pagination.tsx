import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button, LinkButton } from './Button';

export interface PaginationProps {
  /**
   * Link targets (locale-less paths with the query, e.g. `?cursor=…`) for server-rendered
   * lists. `null` or absent disables the control.
   */
  previousHref?: string | null;
  nextHref?: string | null;
  /** Handlers for lists paged in client state; used when the matching href is not given. */
  onPrevious?: (() => void) | null;
  onNext?: (() => void) | null;
  /** 1-based. Shown as "Page N", or "Page N of M" with `totalPages`. */
  page?: number;
  totalPages?: number;
  className?: string;
}

function PageControl({
  href,
  onClick,
  children,
}: {
  href?: string | null;
  onClick?: (() => void) | null;
  children: ReactNode;
}) {
  if (href) {
    return (
      <LinkButton href={href} variant="secondary" size="sm">
        {children}
      </LinkButton>
    );
  }
  return (
    <Button variant="secondary" size="sm" disabled={!onClick} onClick={onClick ?? undefined}>
      {children}
    </Button>
  );
}

/** Previous / next paging, which is what cursor-based lists (`Page<T>.nextCursor`) support. */
export function Pagination({
  previousHref,
  nextHref,
  onPrevious,
  onNext,
  page,
  totalPages,
  className,
}: PaginationProps) {
  const t = useTranslations('common');
  // On a phone the two labels do not fit beside the page count: the icon stays, the text is
  // kept for screen readers.
  const labelClasses = 'sr-only sm:not-sr-only';

  return (
    <nav
      aria-label={t('pagination.label')}
      className={cn('flex items-center justify-between gap-3', className)}
    >
      <PageControl href={previousHref} onClick={onPrevious}>
        <ChevronLeft aria-hidden="true" className="rtl:rotate-180" />
        <span className={labelClasses}>{t('pagination.previous')}</span>
      </PageControl>
      {page !== undefined && (
        <p className="text-sm text-ink-muted tabular-nums">
          {totalPages !== undefined
            ? t('pagination.pageOf', { page, total: totalPages })
            : t('pagination.page', { page })}
        </p>
      )}
      <PageControl href={nextHref} onClick={onNext}>
        <span className={labelClasses}>{t('pagination.next')}</span>
        <ChevronRight aria-hidden="true" className="rtl:rotate-180" />
      </PageControl>
    </nav>
  );
}
