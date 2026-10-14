'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { cn } from '@/lib/utils';

const SIDES = {
  start: cn(
    'inset-y-0 inset-s-0 inset-e-auto h-dvh max-h-none w-80 max-w-[calc(100vw-3rem)]',
    'starting:-translate-x-6 rtl:starting:translate-x-6',
  ),
  bottom: cn(
    'inset-x-0 top-auto bottom-0 max-h-[85dvh] w-full max-w-none rounded-t-card',
    'starting:translate-y-6',
  ),
} as const;

export interface DrawerProps {
  open: boolean;
  /** Called for Escape, the close button and a click on the backdrop; set `open` to false in it. */
  onClose: () => void;
  /** Names the drawer for assistive technology. */
  label: string;
  closeLabel: string;
  side?: keyof typeof SIDES;
  /** Shown next to the close button (a logo, a title). */
  header?: ReactNode;
  /** Mounted only while open. */
  children: ReactNode;
}

/**
 * A panel that slides in over the page on small screens (the navigation of the app shell). A
 * native modal `<dialog>`, so the browser traps and restores focus; laid out by the logical
 * side, so it opens from the right in a right-to-left language.
 */
export function Drawer({
  open,
  onClose,
  label,
  closeLabel,
  side = 'start',
  header,
  children,
}: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
    const root = document.documentElement;
    const previous = { overflow: root.style.overflow, gutter: root.style.scrollbarGutter };
    if (window.innerWidth > root.clientWidth) root.style.scrollbarGutter = 'stable';
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous.overflow;
      root.style.scrollbarGutter = previous.gutter;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      // The owner's state closes the drawer, not the browser, so the two cannot drift apart.
      onCancel={(event) => {
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        onClose();
      }}
      // The browser closes a dialog by itself on a second Escape after a prevented cancel.
      onClose={(event) => {
        if (event.target === event.currentTarget && open && !event.currentTarget.open) onClose();
      }}
      // The element has no padding, so a click that lands on it is a click on the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        'fixed m-0 overflow-hidden bg-surface p-0 text-ink shadow-2xl backdrop:bg-ink/50',
        'transition-[opacity,translate] duration-200 starting:opacity-0',
        SIDES[side],
      )}
    >
      {open && (
        <div className="flex h-full max-h-[inherit] flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-border py-2 ps-4 pe-2">
            <div className="min-w-0">{header}</div>
            <IconButton aria-label={closeLabel} onClick={onClose}>
              <X />
            </IconButton>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        </div>
      )}
    </dialog>
  );
}
