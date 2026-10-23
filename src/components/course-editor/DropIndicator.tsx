import { cn } from '@/lib/utils';

/**
 * The 2 px line where a dragged row will land (5.5): before the row at `slot`, or after the
 * last row when `slot` equals the row count. The row that renders it is `relative`.
 */
export function DropIndicator({
  slot,
  index,
  count,
}: {
  slot: number | null;
  index: number;
  count: number;
}) {
  if (slot === null) return null;
  const before = slot === index;
  const after = slot === count && index === count - 1;
  if (!before && !after) return null;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-x-0 z-10 h-0.5 rounded-full bg-brand-600',
        before ? '-top-1' : '-bottom-1',
      )}
    />
  );
}
