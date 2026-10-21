'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { IconButton } from './IconButton';

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' } as const;

export interface DialogProps {
  open: boolean;
  /** Called for Escape, the close button and a click on the backdrop; set `open` to false in it. */
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** Mounted only while open, so a form inside starts fresh each time. */
  children?: ReactNode;
  /** The action row (Cancel / Confirm buttons). */
  footer?: ReactNode;
  size?: keyof typeof SIZES;
  /** `false` removes the close button and ignores Escape and the backdrop (an action in flight). */
  dismissible?: boolean;
  className?: string;
}

/**
 * A modal on the native `<dialog>`: focus is trapped and restored by the browser. Focus starts
 * on the element marked `data-autofocus`, else on the first focusable one.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissible = true,
  className,
}: DialogProps) {
  const t = useTranslations('common');
  const ref = useRef<HTMLDialogElement>(null);
  const pressStartedOnBackdrop = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  // A confirmation has only a title, a description and actions.
  const hasBody = children !== undefined && children !== null && children !== false;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }
    // The page behind must not scroll. Where the scrollbar takes up room (Windows), its gutter
    // is kept so the page does not shift sideways as the bar disappears.
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
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // Escape. The owner's state closes the dialog, not the browser, so the two cannot drift
      // apart. A file input inside the dialog sends a bubbling `cancel` of its own when its
      // picker is dismissed; that one is not ours.
      onCancel={(event) => {
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        if (dismissible) onClose();
      }}
      // Also fires, a frame late, for close() in the effect above. It matters only when the
      // browser closed the dialog by itself, which it does on a second Escape after a prevented
      // cancel: the owner is told, or a dialog that may not be dismissed is shown again.
      onClose={(event) => {
        const dialog = event.currentTarget;
        if (event.target !== dialog || !open || dialog.open) return;
        if (dismissible) onClose();
        else dialog.showModal();
      }}
      onPointerDown={(event) => {
        pressStartedOnBackdrop.current = event.target === event.currentTarget;
      }}
      // The dialog element has no padding, so a click that lands on it is on the backdrop. A
      // drag that starts inside (selecting text) and ends outside is not a dismissal.
      onClick={(event) => {
        if (dismissible && pressStartedOnBackdrop.current && event.target === event.currentTarget) {
          onClose();
        }
      }}
      className={cn(
        // text-start: the <dialog> stays where its owner renders it and would inherit the
        // alignment there (a centred empty state, an end-aligned table cell).
        'm-auto w-[calc(100vw-2rem)] overflow-hidden rounded-card bg-surface p-0 text-start text-ink shadow-2xl',
        'max-h-[calc(100dvh-2rem)] backdrop:bg-ink/50',
        'transition-[opacity,translate] duration-200 starting:translate-y-2 starting:opacity-0',
        SIZES[size],
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <div
            className={cn(
              'flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6',
              !hasBody && 'pb-5',
            )}
          >
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg leading-snug font-semibold break-words">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-sm break-words text-ink-muted">
                  {description}
                </p>
              )}
            </div>
            {dismissible && (
              <IconButton
                aria-label={t('a11y.closeDialog')}
                size="sm"
                onClick={onClose}
                className="-me-1.5 -mt-1.5"
              >
                <X />
              </IconButton>
            )}
          </div>
          {hasBody && (
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          )}
          {footer && (
            <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
