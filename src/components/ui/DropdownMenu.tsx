'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { Check } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import { buttonClasses } from './Button';
import { DANGER_TEXT_ON_TINT } from './tones';

export type DropdownMenuItem =
  | {
      type?: 'item';
      label: string;
      icon?: ReactNode;
      /** A locale-less internal path; the item is then a link. */
      href?: string;
      onSelect?: () => void;
      tone?: 'default' | 'danger';
      disabled?: boolean;
      /** Marks the current choice of a set (the active language): shows a tick. */
      selected?: boolean;
    }
  | { type: 'separator' }
  | { type: 'heading'; label: string };

export interface DropdownMenuProps {
  /** Content of the trigger button (text, an avatar, an icon). */
  trigger: ReactNode;
  /** Required when the trigger content has no text of its own. */
  'aria-label'?: string;
  items: readonly DropdownMenuItem[];
  /** Which edge of the trigger the panel lines up with; `end` suits the top bar. */
  align?: 'start' | 'end';
  /** Replaces the default (ghost button) look of the trigger. */
  triggerClassName?: string;
  className?: string;
}

const ITEM_SELECTOR = '[role^="menuitem"]:not([aria-disabled="true"])';

export function DropdownMenu({
  trigger,
  'aria-label': ariaLabel,
  items,
  align = 'end',
  triggerClassName,
  className,
}: DropdownMenuProps) {
  const menuId = useId();
  const triggerId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Which item takes focus when the menu opens; null while it is closed.
  const [open, setOpen] = useState<'first' | 'last' | null>(null);

  useEffect(() => {
    if (!open) return;
    const focusable = menuRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR);
    focusable?.[open === 'first' ? 0 : focusable.length - 1]?.focus();

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  function close(restoreFocus: boolean) {
    setOpen(null);
    if (restoreFocus) triggerRef.current?.focus();
  }

  function onTriggerKeyDown(event: ReactKeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(event.key === 'ArrowDown' ? 'first' : 'last');
    }
  }

  function onMenuKeyDown(event: ReactKeyboardEvent) {
    const focusable = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? [],
    );
    const current = focusable.indexOf(document.activeElement as HTMLElement);
    const last = focusable.length - 1;
    let next: number;
    switch (event.key) {
      case 'ArrowDown':
        next = current >= last ? 0 : current + 1;
        break;
      case 'ArrowUp':
        next = current <= 0 ? last : current - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        close(true);
        return;
      case 'Tab':
        setOpen(null);
        return;
      default:
        return;
    }
    event.preventDefault();
    focusable[next]?.focus();
  }

  return (
    <div
      ref={rootRef}
      className={cn('relative inline-flex', className)}
      // A blur without a destination is a click on something unfocusable (Safari does not
      // focus buttons, menu items included); the pointerdown listener covers that case.
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
          setOpen(null);
        }
      }}
    >
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open !== null}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen(open ? null : 'first')}
        onKeyDown={onTriggerKeyDown}
        className={
          triggerClassName ??
          cn(buttonClasses({ variant: 'ghost', size: 'md' }), 'aria-expanded:bg-brand-50')
        }
      >
        {trigger}
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          onKeyDown={onMenuKeyDown}
          className={cn(
            'absolute top-full z-50 mt-1.5 max-h-[min(24rem,70dvh)] max-w-[calc(100vw-2rem)] min-w-52 overflow-y-auto rounded-control border border-border bg-surface p-1.5 shadow-xl',
            'transition-[opacity,translate] duration-150 starting:-translate-y-1 starting:opacity-0',
            align === 'end' ? 'inset-e-0' : 'inset-s-0',
          )}
        >
          {items.map((item, index) => {
            if (item.type === 'separator') {
              return <div key={index} role="separator" className="my-1.5 h-px bg-border" />;
            }
            if (item.type === 'heading') {
              return (
                <div
                  key={index}
                  role="presentation"
                  className="px-2.5 pt-1.5 pb-1 text-xs font-semibold text-ink-muted"
                >
                  {item.label}
                </div>
              );
            }
            const isChoice = item.selected !== undefined;
            const shared = {
              role: isChoice ? 'menuitemradio' : 'menuitem',
              'aria-checked': isChoice ? item.selected : undefined,
              'aria-disabled': item.disabled || undefined,
              tabIndex: -1,
              className: cn(
                'flex min-h-10 w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-start text-sm font-medium transition-colors [&>svg]:size-4 [&>svg]:shrink-0',
                'focus-visible:-outline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
                item.tone === 'danger'
                  ? cn(DANGER_TEXT_ON_TINT, 'hover:bg-danger/10 focus-visible:bg-danger/10')
                  : 'text-ink hover:bg-surface-muted focus-visible:bg-surface-muted',
              ),
            } as const;
            const content = (
              <>
                {item.icon}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.selected && <Check aria-hidden="true" className="text-brand-600" />}
              </>
            );
            const activate = () => {
              if (item.disabled) return;
              item.onSelect?.();
              close(!item.href);
            };
            return item.href && !item.disabled ? (
              <Link key={index} href={item.href} onClick={activate} {...shared}>
                {content}
              </Link>
            ) : (
              <button key={index} type="button" onClick={activate} {...shared}>
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
