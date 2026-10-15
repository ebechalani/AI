'use client';

import { useTranslations } from 'next-intl';
import type { ActionError } from '@/types/actions';

/**
 * `errors.<code>`, with the retry delay appended to a rate limit when it is known, and the
 * offline notice for an internal error while the browser is offline (the WS-A rule, 10.5).
 */
export function useActionErrorMessage(): (error: ActionError) => string {
  const t = useTranslations('errors');
  return (error) => {
    if (error.code === 'rate_limited' && error.retryAfterSeconds !== undefined) {
      const seconds = error.retryAfterSeconds;
      const hint =
        seconds < 60
          ? t('retry.seconds', { seconds })
          : seconds < 3600
            ? t('retry.minutes', { minutes: Math.ceil(seconds / 60) })
            : t('retry.tomorrow');
      return `${t('rate_limited')} ${hint}`;
    }
    if (error.code === 'internal' && typeof navigator !== 'undefined' && !navigator.onLine) {
      return t('offline');
    }
    return t(error.code);
  };
}
