import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const ALIGN = { start: 'text-start', center: 'text-center', end: 'text-end' } as const;

type Align = keyof typeof ALIGN;

export interface TableProps extends Omit<ComponentProps<'table'>, 'ref'> {
  /** Names the table (and its scroll area) for screen readers; not shown. */
  caption: string;
}

/**
 * The table sits in its own horizontally scrolling, keyboard-focusable region, so a wide table
 * never makes the page scroll sideways on a phone.
 */
export function Table({ caption, className, children, ...props }: TableProps) {
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className={cn('overflow-x-auto rounded-card border border-border bg-surface', className)}
    >
      <table className="w-full border-collapse text-start text-sm" {...props}>
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ className, ...props }: ComponentProps<'thead'>) {
  return <thead className={cn('bg-surface-muted', className)} {...props} />;
}

export function TableBody({ className, ...props }: ComponentProps<'tbody'>) {
  return <tbody className={className} {...props} />;
}

export function TableRow({ className, ...props }: ComponentProps<'tr'>) {
  return (
    <tr
      className={cn(
        'border-t border-border first:border-t-0 [tbody>&]:hover:bg-surface-muted/60',
        className,
      )}
      {...props}
    />
  );
}

export interface TableHeaderCellProps extends Omit<ComponentProps<'th'>, 'align'> {
  align?: Align;
  /**
   * Lets the text wrap (`whitespace-normal`) instead of keeping it on one line: a long column
   * header, or a row header that holds a name. `className` cannot do it, because `cn` does not
   * resolve two `white-space` utilities.
   */
  wrap?: boolean;
}

/** A column header by default; pass `scope="row"` for the cell that names a row. */
export function TableHeaderCell({
  align = 'start',
  scope = 'col',
  wrap = false,
  className,
  ...props
}: TableHeaderCellProps) {
  return (
    <th
      scope={scope}
      className={cn(
        'px-4 py-3 font-semibold',
        wrap ? 'whitespace-normal' : 'whitespace-nowrap',
        scope === 'col' ? 'text-xs text-ink-muted' : 'text-ink',
        ALIGN[align],
        className,
      )}
      {...props}
    />
  );
}

export interface TableCellProps extends Omit<ComponentProps<'td'>, 'align'> {
  align?: Align;
}

export function TableCell({ align = 'start', className, ...props }: TableCellProps) {
  return (
    <td className={cn('px-4 py-3 align-middle text-ink', ALIGN[align], className)} {...props} />
  );
}
