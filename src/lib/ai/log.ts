import 'server-only';
import { AiError } from './types';

/**
 * The one way to put an AI failure in a log line: the reason and our own message, never the
 * `cause` (an SDK error can echo request content) and never prompt or reply text.
 */
export function describeAiFailure(error: unknown): string {
  if (error instanceof AiError) return `AiError(${error.reason}): ${error.message}`;
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return 'unknown failure';
}
