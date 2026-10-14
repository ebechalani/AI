'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  value: string;
  label: ReactNode;
  /** May be server-rendered. Every panel stays mounted, so state inside a hidden one survives. */
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: readonly TabItem[];
  /** Names the tab list for screen readers. */
  'aria-label': string;
  /** Controlled selection; pair it with `onValueChange`. */
  value?: string;
  /** Initial selection when uncontrolled; defaults to the first enabled tab. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function Tabs({
  tabs,
  'aria-label': ariaLabel,
  value,
  defaultValue,
  onValueChange,
  className,
}: TabsProps) {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [internal, setInternal] = useState(defaultValue);
  const requested = value ?? internal;
  const selected =
    tabs.find((tab) => tab.value === requested && !tab.disabled) ??
    tabs.find((tab) => !tab.disabled);

  function select(tab: TabItem) {
    if (value === undefined) setInternal(tab.value);
    onValueChange?.(tab.value);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const enabled = tabs.filter((tab) => !tab.disabled);
    const current = enabled.findIndex((tab) => tab.value === selected?.value);
    const forward = getComputedStyle(event.currentTarget).direction === 'rtl' ? -1 : 1;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
        next = current + forward;
        break;
      case 'ArrowLeft':
        next = current - forward;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = enabled.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const target = enabled[(next + enabled.length) % enabled.length];
    if (!target) return;
    select(target);
    listRef.current
      ?.querySelector<HTMLElement>(`[data-tab-index="${tabs.indexOf(target)}"]`)
      ?.focus();
  }

  return (
    <div className={cn('min-w-0', className)}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
        // The rule under the tabs is an inset shadow, not a border: each tab's own bottom border
        // then paints over it without a negative margin, which would overflow the scroll box
        // downwards and give the list a vertical scrollbar. The horizontal bar is hidden: on a
        // phone the list is swiped, and a tab that is clicked or focused scrolls into view.
        className="flex [scrollbar-width:none] gap-1 overflow-x-auto shadow-[inset_0_-1px_0_var(--color-border)] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab, index) => {
          const active = tab.value === selected?.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              id={`${baseId}-tab-${index}`}
              data-tab-index={index}
              aria-selected={active}
              aria-controls={`${baseId}-panel-${index}`}
              tabIndex={active ? 0 : -1}
              disabled={tab.disabled}
              onClick={(event) => {
                select(tab);
                event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' });
              }}
              className={cn(
                // The list scrolls sideways and would clip an outset focus ring.
                'shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:-outline-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                active
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-ink-muted hover:border-ink-muted/40 hover:text-ink',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.value}
          role="tabpanel"
          id={`${baseId}-panel-${index}`}
          aria-labelledby={`${baseId}-tab-${index}`}
          hidden={tab.value !== selected?.value}
          tabIndex={0}
          className="rounded-control pt-4"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
