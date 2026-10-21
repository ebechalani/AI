'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

/** Width of the fade at an edge of the tab list that has more tabs past it (1.5rem). */
const FADE_PX = 24;

/**
 * Scrolls the tab list, never the page, just enough to show `tab` whole and clear of the edge
 * fade (`scrollIntoView` could also scroll the page). Physical coordinates: lowering
 * `scrollLeft` shows what is further left, in a right-to-left list too, and the browser clamps
 * it at both ends, where no fade is drawn.
 */
function revealTab(list: HTMLElement, tab: HTMLElement): void {
  const listBox = list.getBoundingClientRect();
  const tabBox = tab.getBoundingClientRect();
  const margin = Math.min(FADE_PX, Math.max(0, (listBox.width - tabBox.width) / 2));
  if (tabBox.left < listBox.left + margin) {
    list.scrollLeft -= listBox.left + margin - tabBox.left;
  } else if (tabBox.right > listBox.right - margin) {
    list.scrollLeft += tabBox.right - (listBox.right - margin);
  }
}

interface Overflow {
  start: boolean;
  end: boolean;
}

/**
 * Whether tabs lie past the start or the end edge of the list. `scrollLeft` is 0 at the start
 * and grows towards the end (negative in a right-to-left list).
 */
function measureOverflow(list: HTMLElement): Overflow {
  const hidden = list.scrollWidth - list.clientWidth;
  const offset = Math.abs(list.scrollLeft);
  return { start: offset > 1, end: hidden - offset > 1 };
}

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
  const [overflow, setOverflow] = useState<Overflow>({ start: false, end: false });
  const requested = value ?? internal;
  const selected =
    tabs.find((tab) => tab.value === requested && !tab.disabled) ??
    tabs.find((tab) => !tab.disabled);
  const selectedIndex = selected ? tabs.indexOf(selected) : -1;
  const tabKeys = tabs.map((tab) => tab.value).join('\n');

  const syncOverflow = useCallback(() => {
    const list = listRef.current;
    if (list === null) return;
    const next = measureOverflow(list);
    setOverflow((current) =>
      current.start === next.start && current.end === next.end ? current : next,
    );
  }, []);

  // The selected tab is always whole in view: on mount (a tab chosen by the URL can sit past
  // the edge on a phone), after a keyboard or pointer selection, and when the owner changes it.
  useEffect(() => {
    const list = listRef.current;
    const tab = list?.querySelector<HTMLElement>(`[data-tab-index="${selectedIndex}"]`);
    if (list && tab) revealTab(list, tab);
    syncOverflow();
  }, [selectedIndex, syncOverflow]);

  // The edge fades follow the list's size and its tabs' (a label that changes, a font that loads).
  useEffect(() => {
    const list = listRef.current;
    if (list === null || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(syncOverflow);
    observer.observe(list);
    for (const tab of list.children) observer.observe(tab);
    return () => observer.disconnect();
  }, [tabKeys, syncOverflow]);

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
    const list = listRef.current;
    const tab = list?.querySelector<HTMLElement>(`[data-tab-index="${tabs.indexOf(target)}"]`);
    if (!list || !tab) return;
    // focus() alone may leave the tab partly hidden, or scroll the page: the list scrolls instead.
    tab.focus({ preventScroll: true });
    revealTab(list, tab);
  }

  return (
    <div className={cn('min-w-0', className)}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
        onScroll={syncOverflow}
        data-overflow-start={overflow.start || undefined}
        data-overflow-end={overflow.end || undefined}
        // The rule under the tabs is an inset shadow, not a border: each tab's own bottom border
        // then paints over it without a negative margin, which would overflow the scroll box
        // downwards and give the list a vertical scrollbar. The horizontal bar is hidden: on a
        // phone the list is swiped, the selected tab is kept in view, and an edge with more tabs
        // past it fades out: a mask of two gradients, one per edge, intersected; each is 0 wide
        // while its edge has nothing past it, and the data attributes follow the scroll position.
        className={cn(
          'flex [scrollbar-width:none] gap-1 overflow-x-auto shadow-[inset_0_-1px_0_var(--color-border)] [&::-webkit-scrollbar]:hidden',
          '[--tab-fade-end:0px] [--tab-fade-start:0px] data-[overflow-end]:[--tab-fade-end:1.5rem] data-[overflow-start]:[--tab-fade-start:1.5rem]',
          '[--tab-from-end:to_left] [--tab-from-start:to_right] rtl:[--tab-from-end:to_right] rtl:[--tab-from-start:to_left]',
          'data-[overflow-end]:[mask-composite:intersect] data-[overflow-start]:[mask-composite:intersect]',
          'data-[overflow-end]:[mask-image:var(--tab-fade-mask)] data-[overflow-start]:[mask-image:var(--tab-fade-mask)]',
          '[--tab-fade-mask:linear-gradient(var(--tab-from-start),transparent,#000_var(--tab-fade-start)),linear-gradient(var(--tab-from-end),transparent,#000_var(--tab-fade-end))]',
        )}
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
                // Also when the tab was already selected (no effect runs then).
                if (listRef.current) revealTab(listRef.current, event.currentTarget);
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
