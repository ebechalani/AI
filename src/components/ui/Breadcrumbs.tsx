import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  /** A locale-less internal path. The last item (the current page) needs none. */
  href?: string;
}

export interface BreadcrumbsProps {
  /** From the top of the hierarchy down to the current page. */
  items: readonly BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const t = useTranslations('nav');
  return (
    <nav aria-label={t('shell.breadcrumbs')} className={className}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={index} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && (
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-ink-muted rtl:rotate-180"
                />
              )}
              {item.href && !current ? (
                <Link
                  href={item.href}
                  className="max-w-48 truncate rounded-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={current ? 'page' : undefined}
                  className={cn(
                    'max-w-64 truncate',
                    current ? 'font-semibold text-ink' : 'text-ink-muted',
                  )}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
