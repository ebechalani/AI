export const ACTION_ERROR_CODES = [
  'validation',
  'unauthenticated',
  'forbidden',
  'not_found',
  'conflict',
  'rate_limited',
  'license_required',
  'profile_missing',
  'email_unverified',
  'not_implemented',
  'internal',
] as const;
export type ActionErrorCode = (typeof ACTION_ERROR_CODES)[number];

export interface ActionError {
  code: ActionErrorCode;
  /**
   * Keyed by the dot-joined path of the field ('translations.en.title', 'questions.0.options');
   * problems with the input as a whole are under '_form'. Every string is a key of the
   * `validation` message namespace, never text.
   */
  fieldErrors?: Record<string, string[]>;
  retryAfterSeconds?: number;
}

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };
