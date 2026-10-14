import 'server-only';
import type { z } from 'zod';
import type { TutorMode } from '@/types/ai';
import type { AgeBand, Locale } from '@/types/common';

export type AiProviderId = 'mock' | 'anthropic';
export type AiPurpose = 'tutor' | 'review' | 'lab';

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
}

export type AiStopReason = 'end' | 'max_tokens' | 'refusal' | 'error';

export interface AiTextRequest {
  purpose: AiPurpose;
  system: string;
  messages: AiMessage[];
  /**
   * A visible-length target (AI_LIMITS.maxOutputTokens), held by the prompt and by checkOutput.
   * An adapter does not pass it on as the provider's hard cap, which needs headroom for
   * reasoning tokens.
   */
  maxOutputTokens: number;
  signal?: AbortSignal;
}

export interface AiTextResult {
  text: string;
  usage: AiUsage;
  stopReason: AiStopReason;
  model: string;
}

export type AiStreamEvent =
  | { type: 'text'; text: string }
  | { type: 'done'; usage: AiUsage; stopReason: AiStopReason; model: string };

export interface AiObjectRequest<T> extends AiTextRequest {
  schema: z.ZodType<T>;
  schemaName: string;
}

export interface AiObjectResult<T> {
  object: T;
  usage: AiUsage;
  stopReason: AiStopReason;
  model: string;
}

/** No vendor concepts: a second provider is one file in providers/ and one branch in getAiProvider(). */
export interface AiProvider {
  readonly id: AiProviderId;
  generateText(request: AiTextRequest): Promise<AiTextResult>;
  /** Text events, then exactly one `done` event. */
  streamText(request: AiTextRequest): AsyncIterable<AiStreamEvent>;
  generateObject<T>(request: AiObjectRequest<T>): Promise<AiObjectResult<T>>;
}

/**
 * Built on the server by services/tutor-context.buildTutorContext. It carries no name, uid,
 * email, school, class, quiz question or answer key.
 */
export interface TutorContext {
  mode: TutorMode;
  ageBand: AgeBand;
  locale: Locale;
  /** The lesson contains a quiz or a project. */
  hasGradedWork: boolean;
  /** Course-authored text: untrusted input, sent to the provider as delimited data. */
  reference: {
    pathwayTitle: string | null;
    courseTitle: string | null;
    lessonTitle: string | null;
    lessonSummary: string | null;
    /** `lessons.tutorExcerpt`; null unless the course is official. */
    lessonExcerpt: string | null;
  };
  /** At most AI_LIMITS.tutorRecentQuizResults entries. */
  recentQuizResults: { quizTitle: string; scorePercent: number; passed: boolean }[];
}

export const NO_USAGE: AiUsage = { inputTokens: 0, outputTokens: 0 };

export type AiFailureReason =
  /** The provider call failed or reported an error. */
  | 'provider_error'
  /** The reply ended at the provider's output cap; a partial object is never used. */
  | 'incomplete'
  | 'refused'
  /** The reply did not match the requested shape, was empty or was far too long. */
  | 'invalid_output'
  /** checkOutput refused the reply: the caller increments `blockedCount`. */
  | 'blocked';

/**
 * A failed AI call. `usage` is what the call consumed before it failed, so the caller can
 * still record the tokens. The message never contains prompt or reply text.
 */
export class AiError extends Error {
  readonly reason: AiFailureReason;
  readonly usage: AiUsage;

  constructor(
    reason: AiFailureReason,
    options: { usage?: AiUsage; cause?: unknown; message?: string } = {},
  ) {
    super(options.message ?? reason, { cause: options.cause });
    this.name = 'AiError';
    this.reason = reason;
    this.usage = options.usage ?? NO_USAGE;
  }
}
