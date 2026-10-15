import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';

export interface HomeSectionProps {
  /** The id of the `<h2>`, which also names the section. */
  id: string;
  title: string;
  /** The "view all" link of the section; its label names what it lists. */
  action?: { href: string; label: string };
  children: ReactNode;
}

/** One block of the Student Home: an h2, an optional "view all" link, then the content. */
export function HomeSection({ id, title, action, children }: HomeSectionProps) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={id} className="text-xl font-bold text-ink">
          {title}
        </h2>
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
