'use client';

import { cloneElement, useEffect, useId, useState, type ReactElement, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { describedBy } from './control';

export interface TooltipProps {
  /** Short, plain text: supplementary, never the only place a piece of information lives. */
  content: ReactNode;
  /** One focusable element (a button, a link); it receives `aria-describedby`. */
  children: ReactElement<{ 'aria-describedby'?: string }>;
  side?: 'top' | 'bottom';
  /** Use `start` / `end` for a trigger near that edge of the screen, so the bubble stays on it. */
  align?: 'center' | 'start' | 'end';
  className?: string;
}

const ALIGN = {
  // inset-inline-start is logical, translate is not: the shift flips by hand in RTL.
  center: 'inset-s-1/2 -translate-x-1/2 rtl:translate-x-1/2',
  start: 'inset-s-0',
  end: 'inset-e-0',
} as const;

export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  className,
}: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <span
      className={cn('relative inline-flex', className)}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      // Keyboard focus only: after a mouse click the trigger keeps focus, and the bubble would
      // stay up over whatever the click opened.
      onFocus={(event) => {
        if (event.target.matches(':focus-visible')) setOpen(true);
      }}
      onBlur={() => setOpen(false)}
    >
      {cloneElement(children, {
        'aria-describedby': describedBy(children.props['aria-describedby'], id),
      })}
      {/* Inside the wrapper, so the pointer can move onto the bubble without closing it. */}
      <span
        role="tooltip"
        id={id}
        hidden={!open}
        className={cn(
          'absolute z-50 w-max max-w-[min(16rem,calc(100vw-2rem))] rounded-md bg-ink px-2.5 py-1.5 text-start text-xs leading-snug font-medium text-white shadow-lg',
          side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          ALIGN[align],
        )}
      >
        {content}
      </span>
    </span>
  );
}
