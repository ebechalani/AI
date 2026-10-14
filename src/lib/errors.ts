import type { ActionErrorCode } from '@/types/actions';

/**
 * An expected failure. Repositories and services throw these; runAction turns `code` into an
 * ActionResult error and the client shows `errors.<code>`. `message` is for server logs only
 * and never reaches the browser.
 */
export class AppError extends Error {
  constructor(
    public readonly code: ActionErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'AppError';
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message?: string) {
    super('unauthenticated', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message?: string) {
    super('forbidden', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message?: string) {
    super('not_found', message);
  }
}

export class ConflictError extends AppError {
  constructor(message?: string) {
    super('conflict', message);
  }
}

export class LicenseRequiredError extends AppError {
  constructor(message?: string) {
    super('license_required', message);
  }
}

/** For checks that zod cannot make. `fieldErrors` follows the convention of ActionError. */
export class ValidationError extends AppError {
  constructor(
    message?: string,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super('validation', message);
  }
}

export class RateLimitError extends AppError {
  constructor(
    public readonly retryAfterSeconds: number | null,
    message?: string,
  ) {
    super('rate_limited', message);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
