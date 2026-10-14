import type { ReactNode } from 'react';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  /** The page's `<h1>`. */
  title: string;
  description?: string;
  /** Buttons for the page as a whole, shown at the end of the title row. */
  actions?: ReactNode;
  /** From the top of the hierarchy down to this page. */
  breadcrumbs?: readonly BreadcrumbItem[];
  className?: string;
}

/** The standard title row of a page. */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('mb-6 flex flex-col gap-3 sm:mb-8', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="text-2xl leading-tight font-bold tracking-tight break-words text-ink sm:text-3xl">
            {title}
          </h1>
          {description && <p className="mt-2 max-w-2xl text-base text-ink-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
