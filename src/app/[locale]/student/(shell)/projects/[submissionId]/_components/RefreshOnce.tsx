'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from '@/lib/i18n/navigation';

/**
 * Reads the page again once, after it has shown: for a page whose own read changed what the
 * shell around it shows (XP and level after a review that finished during the read). The next
 * read finds nothing new, so it does not render this again.
 */
export function RefreshOnce() {
  const router = useRouter();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    router.refresh();
  }, [router]);
  return null;
}
