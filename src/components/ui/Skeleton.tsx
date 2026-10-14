import { cn } from '@/lib/utils';

export interface SkeletonProps {
  /** Size and shape (`h-40 w-full rounded-card`, `size-10 rounded-full`). Defaults to one text line. */
  className?: string;
  /** Renders that many text lines instead of one block, the last one shorter. */
  lines?: number;
}

const BLOCK = 'block bg-border/80 motion-safe:animate-pulse';
const HAS_RADIUS = /(?:^|\s)rounded(?:-|\s|$)/;

/**
 * A placeholder shape, hidden from screen readers: the `loading.tsx` that uses it says
 * "Loading…" once (a `Spinner`, or a visually hidden status line).
 */
export function Skeleton({ className, lines }: SkeletonProps) {
  if (lines !== undefined) {
    return (
      <span aria-hidden="true" className={cn('flex flex-col gap-2.5', className)}>
        {Array.from({ length: lines }, (_, index) => (
          <span
            key={index}
            className={cn(
              BLOCK,
              'h-4 rounded-control',
              index === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full',
            )}
          />
        ))}
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        BLOCK,
        // Two radius utilities on one element do not resolve by order in the class list, so the
        // default is left out when the caller brings a radius.
        !(className && HAS_RADIUS.test(className)) && 'rounded-control',
        className ?? 'h-4 w-full',
      )}
    />
  );
}
