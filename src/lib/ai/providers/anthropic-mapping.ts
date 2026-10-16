import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type {
  BetaJSONOutputFormat,
  BetaMessageStreamParams,
} from '@anthropic-ai/sdk/resources/beta/messages';
import {
  AiError,
  NO_USAGE,
  type AiPurpose,
  type AiStopReason,
  type AiTextRequest,
  type AiUsage,
} from '../types';

// The pure half of the Anthropic adapter (ARCHITECTURE.md 8.1): request shape, stop reasons,
// usage and errors. Exported for the unit tests; providers/anthropic.ts does the I/O.

/** Provider hard cap per purpose: headroom for adaptive thinking (8.1). Never AI_LIMITS.maxOutputTokens. */
export const PROVIDER_MAX_TOKENS: Record<AiPurpose, number> = {
  tutor: 8_000,
  lab: 8_000,
  review: 16_000,
};

/** Explicit, because claude-opus-5-5 defaults to 'medium' (8.1: low for tutor and lab, medium for review). */
export const EFFORT: Record<AiPurpose, 'low' | 'medium'> = {
  tutor: 'low',
  lab: 'low',
  review: 'medium',
};

/** SDK `timeout` (time to the response headers; the SDK clears it once headers arrive) per purpose. */
export const REQUEST_TIMEOUT_MS: Record<AiPurpose, number> = {
  tutor: 20_000,
  lab: 20_000,
  review: 45_000,
};

export const MAX_RETRIES: Record<AiPurpose, number> = { tutor: 1, lab: 1, review: 1 };

/**
 * Whole-call deadline (AbortSignal.timeout). tutor/lab: below the route's and the lab page's
 * maxDuration of 60 s. review: below AI_LIMITS.reviewRetriggerAfterMs (2 min), because
 * services/project-flow re-runs a review still 'pending' two minutes after submission when
 * the submission is read, and regenerateAiReview awaits the call inside a server action.
 */
export const DEADLINE_MS: Record<AiPurpose, number> = {
  tutor: 50_000,
  lab: 50_000,
  review: 100_000,
};

/** Server-side refusal fallback (beta). The "default" scalar form routes by refusal category. */
export const SERVER_FALLBACK_BETA = 'server-side-fallback-2026-07-01';

// Product question Q1: remove an entry to stop retrying that model's declines server-side.
const SERVER_FALLBACK_MODELS: ReadonlySet<string> = new Set([
  'claude-opus-5-5',
  'claude-opus-5',
  'claude-fable-5-1',
  'claude-sonnet-5-5',
]);

export function supportsServerFallback(model: string): boolean {
  return SERVER_FALLBACK_MODELS.has(model);
}

// --- Request ------------------------------------------------------------------------------------

/**
 * No `thinking` field (the model thinks adaptively and rejects `disabled`), no sampling
 * parameters, no prefill, no metadata, no tools. `request.maxOutputTokens` is a visible-length
 * target held by the prompt, never sent. The system prompt is static per purpose, version,
 * mode, age band and locale, so it carries the one cache breakpoint.
 */
export function buildAnthropicParams(
  model: string,
  request: AiTextRequest,
  format?: BetaJSONOutputFormat,
): BetaMessageStreamParams {
  return {
    model,
    max_tokens: PROVIDER_MAX_TOKENS[request.purpose],
    system: [{ type: 'text', text: request.system, cache_control: { type: 'ephemeral' } }],
    messages: request.messages.map(({ role, content }) => ({ role, content })),
    output_config: { effort: EFFORT[request.purpose], ...(format ? { format } : {}) },
    ...(supportsServerFallback(model)
      ? { betas: [SERVER_FALLBACK_BETA], fallbacks: 'default' as const }
      : {}),
  };
}

export interface AnthropicRequestOptions {
  signal: AbortSignal;
  timeout: number;
  maxRetries: number;
}

/** The caller's signal (a client that left) and the whole-call deadline, whichever comes first. */
export function buildRequestOptions(
  request: AiTextRequest,
  deadline: AbortSignal,
): AnthropicRequestOptions {
  return {
    signal: request.signal ? AbortSignal.any([request.signal, deadline]) : deadline,
    timeout: REQUEST_TIMEOUT_MS[request.purpose],
    maxRetries: MAX_RETRIES[request.purpose],
  };
}

// --- Response -----------------------------------------------------------------------------------

export function toStopReason(reason: string | null | undefined): AiStopReason {
  switch (reason) {
    case 'end_turn':
    case 'stop_sequence':
      return 'end';
    case 'max_tokens':
    case 'model_context_window_exceeded':
      return 'max_tokens';
    case 'refusal':
      return 'refusal';
    default:
      // tool_use, pause_turn, compaction, null: nothing this layer asked for.
      return 'error';
  }
}

interface UsageCounts {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

export interface UsageLike extends UsageCounts {
  iterations?: readonly UsageCounts[] | null;
}

const tokens = (value: number | null | undefined): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;

/**
 * With `iterations`, every entry is summed whatever its type: a fallback turn reports one entry
 * per attempt while the top-level fields cover only the attempt that produced the message.
 * Cache writes and reads count as input at full weight (conservative for caps and budgets).
 */
export function toAiUsage(usage: UsageLike | null | undefined): AiUsage {
  if (usage === null || usage === undefined) return NO_USAGE;
  const entries = usage.iterations && usage.iterations.length > 0 ? usage.iterations : [usage];
  let inputTokens = 0;
  let outputTokens = 0;
  for (const entry of entries) {
    inputTokens +=
      tokens(entry.input_tokens) +
      tokens(entry.cache_creation_input_tokens) +
      tokens(entry.cache_read_input_tokens);
    outputTokens += tokens(entry.output_tokens);
  }
  return { inputTokens, outputTokens };
}

/** The text of every `text` block, joined; thinking, fallback and other blocks are skipped. */
export function collectText(message: { content: readonly { type: string }[] }): string {
  return message.content
    .map((block) =>
      block.type === 'text' && 'text' in block && typeof block.text === 'string' ? block.text : '',
    )
    .join('');
}

// --- Errors -------------------------------------------------------------------------------------

export type AnthropicFailureKind =
  | 'deadline'
  | 'aborted'
  | 'timeout'
  | 'connection'
  | 'auth'
  | 'rate_limited'
  | 'overloaded'
  | 'server'
  | 'bad_request'
  | 'unexpected';

let reportedAuthFailure = false;

function failureKind(error: unknown, deadlineHit: boolean): AnthropicFailureKind {
  // Most specific first: the connection errors and the abort extend APIError.
  if (error instanceof Anthropic.APIUserAbortError) return deadlineHit ? 'deadline' : 'aborted';
  if (error instanceof Anthropic.APIConnectionTimeoutError) return 'timeout';
  if (error instanceof Anthropic.APIConnectionError) return 'connection';
  if (
    error instanceof Anthropic.AuthenticationError ||
    error instanceof Anthropic.PermissionDeniedError
  ) {
    return 'auth';
  }
  if (error instanceof Anthropic.RateLimitError) return 'rate_limited';
  if (error instanceof Anthropic.APIError) {
    if (error.status === 529) return 'overloaded';
    if (typeof error.status === 'number' && error.status >= 500) return 'server';
    return 'bad_request';
  }
  return 'unexpected';
}

/**
 * An SDK failure as an AiError. The message names the kind, the HTTP status and the request id
 * only: the SDK's own message can echo request content, so it stays in `cause`, which nothing
 * logs. An AiError passes through unchanged.
 */
export function toAiError(
  error: unknown,
  { usage, deadlineHit }: { usage: AiUsage; deadlineHit: boolean },
): AiError {
  if (error instanceof AiError) return error;
  const kind = failureKind(error, deadlineHit);
  if (kind === 'auth' && !reportedAuthFailure) {
    reportedAuthFailure = true;
    console.error('[ai] Anthropic rejected the API key: check ANTHROPIC_API_KEY.');
  }
  let message = `anthropic ${kind}`;
  if (error instanceof Anthropic.APIError) {
    if (typeof error.status === 'number') message += ` ${error.status}`;
    if (typeof error.requestID === 'string' && error.requestID !== '') {
      message += ` request ${error.requestID}`;
    }
  }
  return new AiError('provider_error', { usage, cause: error, message });
}
