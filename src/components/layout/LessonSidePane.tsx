'use client';

import { useId, type ReactNode, type RefObject } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { cn } from '@/lib/utils';

// Below `xl` a side pane leaves the layout and slides in over the page from its own edge.
const PANE = cn(
  'flex shrink-0 flex-col bg-surface xl:sticky xl:top-0 xl:h-dvh',
  'max-xl:fixed max-xl:inset-y-0 max-xl:z-50 max-xl:max-w-[calc(100vw-3rem)] max-xl:shadow-2xl',
);
// A closed pane is `invisible`, which keeps it out of the tab order. It turns visible the moment
// it opens (focus moves into it right away) and hidden only once it has slid out.
const PANE_OPEN = 'max-xl:visible max-xl:translate-x-0 max-xl:[transition:translate_200ms]';
const PANE_CLOSED = 'max-xl:invisible max-xl:[transition:translate_200ms,visibility_0s_200ms]';
const PANE_SIDES = {
  start: {
    base: 'w-[280px] border-e border-border max-xl:inset-s-0 max-xl:w-80',
    closed: 'max-xl:-translate-x-full max-xl:rtl:translate-x-full',
  },
  end: {
    base: 'w-[360px] border-s border-border max-xl:inset-e-0',
    closed: 'max-xl:translate-x-full max-xl:rtl:-translate-x-full',
  },
} as const;

export interface LessonSidePaneProps {
  side: keyof typeof PANE_SIDES;
  id: string;
  title: string;
  icon?: ReactNode;
  /** The pane's role while it is part of the layout; none when its content is a landmark itself. */
  landmark?: 'complementary';
  /** The content fills the pane's height and scrolls by itself (the chat). */
  fill?: boolean;
  /** Shown as an overlay (below `xl` only). */
  open: boolean;
  closeLabel: string;
  closeRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  children: ReactNode;
}

/** One side pane of the lesson player: a column of the layout from `xl` up, a slide-over below. */
export function LessonSidePane({
  side,
  id,
  title,
  icon,
  landmark,
  fill = false,
  open,
  closeLabel,
  closeRef,
  onClose,
  children,
}: LessonSidePaneProps) {
  const titleId = useId();
  const role = open ? 'dialog' : landmark;
  return (
    <div
      id={id}
      // Over the page the pane is a modal dialog; in the layout it is an ordinary part of it.
      role={role}
      aria-modal={open || undefined}
      aria-labelledby={role ? titleId : undefined}
      className={cn(
        PANE,
        PANE_SIDES[side].base,
        open ? PANE_OPEN : cn(PANE_CLOSED, PANE_SIDES[side].closed),
      )}
    >
      <div className="flex min-h-14 shrink-0 items-center gap-2 border-b border-border ps-4 pe-2">
        {icon}
        <h2 id={titleId} className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
          {title}
        </h2>
        <IconButton ref={closeRef} aria-label={closeLabel} onClick={onClose} className="xl:hidden">
          <X />
        </IconButton>
      </div>
      <div
        className={cn(
          'min-h-0 flex-1',
          fill ? 'flex flex-col *:min-h-0 *:flex-1' : 'overflow-y-auto overscroll-contain',
        )}
      >
        {children}
      </div>
    </div>
  );
}
