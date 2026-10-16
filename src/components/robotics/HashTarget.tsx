'use client';

import { useEffect } from 'react';

export interface HashTargetProps {
  /** The id a link's `#fragment` names; the element should be focusable from script (tabIndex -1). */
  id: string;
}

/**
 * Brings `#id` into view when the page was opened with that hash, as a link such as the
 * challenge facts' "See supported hardware" does. Next applies the hash of an in-app navigation
 * once, when the route commits: when loading.tsx shows first, the target is not there yet and
 * the page stays where it was. This runs once the section is on the page. The shells' scroll
 * margin keeps the target below the top bar (7.5); like Next, it then moves the focus there, so
 * Tab continues from the section.
 */
export function HashTarget({ id }: HashTargetProps) {
  useEffect(() => {
    if (window.location.hash !== `#${id}`) return;
    const target = document.getElementById(id);
    if (target === null) return;
    target.scrollIntoView({ block: 'start' });
    target.focus({ preventScroll: true });
  }, [id]);
  return null;
}
