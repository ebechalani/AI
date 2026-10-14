import type { ActionError, ActionErrorCode, ActionResult } from '@/types/actions';

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

/** `fieldErrors` values are keys of the `validation` message namespace, never text. */
export function fail(
  code: ActionErrorCode,
  extra?: { fieldErrors?: Record<string, string[]>; retryAfterSeconds?: number },
): ActionResult<never> {
  const error: ActionError = { code };
  if (extra?.fieldErrors !== undefined) error.fieldErrors = extra.fieldErrors;
  if (extra?.retryAfterSeconds !== undefined) error.retryAfterSeconds = extra.retryAfterSeconds;
  return { ok: false, error };
}
