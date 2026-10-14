import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface AuthHeadingProps {
  title: string;
  description?: string;
  /** A decorative icon element shown in a tinted tile above the title. */
  icon?: ReactNode;
  align?: 'start' | 'center';
}

/** The `<h1>` of an auth card, with its one-line explanation. */
export function AuthHeading({ title, description, icon, align = 'start' }: AuthHeadingProps) {
  return (
    <div className={cn('flex flex-col gap-2', align === 'center' && 'items-center text-center')}>
      {icon && (
        <span
          aria-hidden="true"
          className="mb-1 flex size-12 items-center justify-center rounded-control bg-brand-100 text-brand-700 [&>svg]:size-6"
        >
          {icon}
        </span>
      )}
      <h1 className="text-2xl leading-tight font-bold tracking-tight text-ink">{title}</h1>
      {description && <p className="text-sm text-ink-muted">{description}</p>}
    </div>
  );
}
