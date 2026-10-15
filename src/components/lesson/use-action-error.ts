import { useTranslations } from 'next-intl';
import { isValidationKey } from '@/lib/schemas/common';
import type { ActionError } from '@/types/actions';

// The lesson player's copy of the action-error hooks (SPEC 1.5): each area keeps its own, so the
// areas stay disjoint.

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

/** The first validation message of a field, translated; an unknown key reads as "invalid". */
export function useFieldError(): (
  fieldErrors: Record<string, string[]> | undefined,
  field: string,
) => string | undefined {
  const t = useTranslations('validation');
  return (fieldErrors, field) => {
    const key = fieldErrors?.[field]?.[0];
    if (key === undefined) return undefined;
    return t(isValidationKey(key) ? key : 'invalid');
  };
}
