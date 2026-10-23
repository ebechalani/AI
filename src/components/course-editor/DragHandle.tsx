'use client';

import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SortableHandleProps } from './use-sortable';

/** The pointer-only grip of a sortable row: hidden from assistive technology, out of the tab order. */
export function DragHandle({
  handle,
  disabled,
  className,
}: {
  handle: SortableHandleProps;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      tabIndex={-1}
      {...handle}
      className={cn(
        'flex size-11 shrink-0 touch-none items-center justify-center rounded-control text-ink-muted select-none',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab hover:bg-surface-muted active:cursor-grabbing',
        className,
      )}
    >
      <GripVertical className="size-5" />
    </span>
  );
}
