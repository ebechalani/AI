'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * A loading button is disabled, which drops its focus to <body>. When the work ends and the
 * focus was not moved anywhere else (an invalid field, say), it goes back to the button.
 */
export function useRefocusAfterPending(
  ref: RefObject<HTMLElement | null>,
  pending: boolean,
): void {
  const wasPending = useRef(false);
  useEffect(() => {
    if (pending) {
      wasPending.current = true;
      return;
    }
    if (!wasPending.current) return;
    wasPending.current = false;
    const active = document.activeElement;
    if (active === null || active === document.body) ref.current?.focus();
  }, [pending, ref]);
}
