'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** The id CheckAgainButton moves focus to when a check changes the panel. */
export const ENTRY_HEADING_ID = 'challenge-entry-title';

/**
 * Whether keyboard focus is gone: on the page itself, on an element that left the page, or on a
 * control that is now disabled (a loading button), which the browser is about to leave.
 */
function focusWasLost(): boolean {
  const active = document.activeElement;
  if (active === null || active === document.body || !active.isConnected) return true;
  return active.matches(':disabled');
}

export interface EntryHeadingProps {
  /**
   * Computed on the server from the state the panel shows. When it changes after the first
   * render (the refresh that follows sending an entry, or a check) and focus was lost, the
   * heading takes it.
   */
  focusKey: string;
  children: ReactNode;
}

/**
 * The entry panel's heading (6.4). Sending an entry through SubmissionForm disables, then
 * unmounts the form that had focus; without this the focus would stay on the page body
 * (WCAG 2.4.3). Focusable from script only.
 */
export function EntryHeading({ focusKey, children }: EntryHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const previous = useRef(focusKey);

  useEffect(() => {
    if (previous.current === focusKey) return;
    previous.current = focusKey;
    if (!focusWasLost()) return;
    const heading = ref.current;
    if (heading === null) return;
    heading.focus({ preventScroll: true });
    // `nearest` keeps the shell's scroll padding, so the heading never ends up under a sticky bar.
    heading.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [focusKey]);

  return (
    <h2
      ref={ref}
      id={ENTRY_HEADING_ID}
      tabIndex={-1}
      className="rounded-sm text-xl font-semibold text-ink"
    >
      {children}
    </h2>
  );
}
