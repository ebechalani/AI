import { useTranslations } from 'next-intl';
import { isAppError, RateLimitError, ValidationError } from '@/lib/errors';
import { isValidationKey } from '@/lib/schemas/common';
import type { ActionError } from '@/types/actions';

export type FieldErrors = Record<string, string[]>;

/**
 * The Firebase client helpers throw AppErrors; this gives them the shape of a failed action so
 * a form reports both kinds of failure through one path.
 */
export function toActionError(error: unknown): ActionError {
  if (error instanceof ValidationError && error.fieldErrors) {
    return { code: 'validation', fieldErrors: error.fieldErrors };
  }
  if (error instanceof RateLimitError && error.retryAfterSeconds !== null) {
    return { code: 'rate_limited', retryAfterSeconds: error.retryAfterSeconds };
  }
  return { code: isAppError(error) ? error.code : 'internal' };
}

/** The first message of a field, translated; an unknown key reads as "invalid". */
export function useFieldError(): (
  fieldErrors: FieldErrors | undefined,
  field: string,
) => string | undefined {
  const t = useTranslations('validation');
  return (fieldErrors, field) => {
    const key = fieldErrors?.[field]?.[0];
    if (key === undefined) return undefined;
    return t(isValidationKey(key) ? key : 'invalid');
  };
}

/** `errors.<code>`, with the retry delay appended to a rate limit when it is known. */
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
