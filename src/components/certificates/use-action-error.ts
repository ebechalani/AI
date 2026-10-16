'use client';

import { useTranslations } from 'next-intl';
import { isValidationKey } from '@/lib/schemas/common';
import type { ActionError } from '@/types/actions';

// The certificates area's copy of the action-error hooks (WS-B SPEC 1.5): each area keeps its
// own, so the areas stay disjoint.

/** `errors.<code>`, with the retry delay of a rate limit, and the offline hint for `internal`. */
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

/** A validation key, translated; an unknown key reads as "invalid". */
export function useValidationMessage(): (key: string | undefined) => string | undefined {
  const t = useTranslations('validation');
  return (key) => (key === undefined ? undefined : t(isValidationKey(key) ? key : 'invalid'));
}
