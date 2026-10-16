import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import { HashTarget } from './HashTarget';

export interface PageSectionProps {
  /** The id of the `<h2>`, which also names the section; unique on the page. */
  id: string;
  title: string;
  description?: string;
  /** A "view all" link; its label names what it leads to. */
  action?: { href: string; label: string };
  /** A link's `#id` target: the heading takes the focus when the page opens there (HashTarget). */
  anchor?: boolean;
  children: ReactNode;
  className?: string;
}

/** One section of a WS-J page (Robotics, Challenges, Achievements): an h2, then the content. */
export function PageSection({
  id,
  title,
  description,
  action,
  anchor = false,
  children,
  className,
}: PageSectionProps) {
  return (
    <section aria-labelledby={id} className={cn('flex min-w-0 flex-col gap-4', className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2
            id={id}
            tabIndex={anchor ? -1 : undefined}
            className="rounded-sm text-xl font-semibold text-ink"
          >
            {title}
          </h2>
          {anchor && <HashTarget id={id} />}
          {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
        </div>
        {action && (
          <Link
            href={action.href}
            className="inline-flex min-h-6 items-center gap-1 rounded-sm text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline"
          >
            {action.label}
            <ArrowRight aria-hidden="true" className="size-4 shrink-0 rtl:rotate-180" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
