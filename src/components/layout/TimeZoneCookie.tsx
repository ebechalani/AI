'use client';

import { useTimeZone } from 'next-intl';
import { useEffect } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { readTimeZoneCookie, timeZoneCookie, toSupportedTimeZone } from '@/lib/i18n/time-zone';

/**
 * Records the browser's time zone in the `tz` cookie that the request config reads
 * (src/lib/i18n/request.ts), so later requests format dates in the viewer's zone on the server
 * and the client alike (ARCHITECTURE.md 12). Mounted once, in `[locale]/layout.tsx`; renders
 * nothing.
 *
 * When the cookie changes and the page on screen was rendered in another zone, the page is
 * rendered again once (`router.refresh()`), so even the first visit ends up in the right zone.
 * Nothing happens when the cookie already holds the zone, which also stops a loop when the
 * server does not know the browser's zone and keeps rendering in UTC.
 */
export function TimeZoneCookie() {
  const renderedTimeZone = useTimeZone();
  const router = useRouter();

  useEffect(() => {
    const browserTimeZone = toSupportedTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (browserTimeZone === null) return;
    if (readTimeZoneCookie(document.cookie) === browserTimeZone) return;
    document.cookie = timeZoneCookie(browserTimeZone, window.location.protocol === 'https:');
    // A browser that blocks cookies would never send it: no point in rendering again.
    const stored = readTimeZoneCookie(document.cookie) === browserTimeZone;
    if (stored && renderedTimeZone !== browserTimeZone) router.refresh();
  }, [renderedTimeZone, router]);

  return null;
}
