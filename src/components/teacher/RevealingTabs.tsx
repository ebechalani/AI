'use client';

import { useEffect, useRef } from 'react';
import { Tabs, type TabsProps } from '@/components/ui';

/** Scrolls the tab list sideways just enough to show `tab` whole. */
function reveal(tab: HTMLElement) {
  const list = tab.closest<HTMLElement>('[role="tablist"]');
  if (list === null) return;
  const tabBox = tab.getBoundingClientRect();
  const listBox = list.getBoundingClientRect();
  if (tabBox.left < listBox.left) list.scrollLeft -= listBox.left - tabBox.left;
  else if (tabBox.right > listBox.right) list.scrollLeft += tabBox.right - listBox.right;
}

/**
 * The kit `Tabs`, with the selected tab always in view. At 375 px the course tabs are wider
 * than the screen and the list's scrollbar is hidden: a tab opened from the URL
 * (`?tab=mine`) or reached with the arrow keys could sit off-screen. Only the list scrolls,
 * never the page. (WS-E-5 asks for this in the primitive.)
 */
export function RevealingTabs(props: TabsProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selected = ref.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (selected) reveal(selected);
  }, []);

  return (
    <div
      ref={ref}
      className="min-w-0"
      onFocus={(event) => {
        if (event.target.getAttribute('role') === 'tab') reveal(event.target);
      }}
    >
      <Tabs {...props} />
    </div>
  );
}
