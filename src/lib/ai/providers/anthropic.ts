import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import type {
  BetaJSONOutputFormat,
  BetaMessage,
  BetaMessageStreamParams,
  BetaRawMessageStreamEvent,
} from '@anthropic-ai/sdk/resources/beta/messages';
import {
  AiError,
  NO_USAGE,
  type AiObjectRequest,
  type AiObjectResult,
  type AiProvider,
  type AiStreamEvent,
  type AiTextRequest,
  type AiTextResult,
  type AiUsage,
} from '../types';
import {
  buildAnthropicParams,
  buildRequestOptions,
  collectText,
  DEADLINE_MS,
  toAiError,
  toAiUsage,
  toStopReason,
} from './anthropic-mapping';

// The real provider (ARCHITECTURE.md 8.1): the official SDK's streaming helper for every call,
// so no request runs into an HTTP timeout; structured outputs validated again with zod; effort
// and the provider cap per purpose; refusals mapped to stopReason 'refusal'.

export interface AnthropicProviderConfig {
  apiKey: string;
  /** ANTHROPIC_MODEL; the default is set in src/lib/env.ts. */
  model: string;
}

type StreamOptions = Parameters<Anthropic['beta']['messages']['stream']>[1];

/** What the adapter uses of the SDK's message stream; tests inject a scripted one. */
export interface AnthropicStreamLike extends AsyncIterable<BetaRawMessageStreamEvent> {
  finalMessage(): Promise<BetaMessage>;
  abort(): void;
}

export interface AnthropicClientLike {
  beta: {
    messages: {
      stream(params: BetaMessageStreamParams, options?: StreamOptions): AnthropicStreamLike;
    };
  };
}

/**
 * The key is the only credential: `authToken: null` stops the SDK from also reading
 * ANTHROPIC_AUTH_TOKEN. `logLevel: 'warn'` wins over ANTHROPIC_LOG, so a debug environment never
 * logs request bodies (children's text). Building the client makes no network call.
 */
export function createAnthropicClient(config: AnthropicProviderConfig): Anthropic {
  return new Anthropic({ apiKey: config.apiKey, authToken: null, maxRetries: 1, logLevel: 'warn' });
}

export function createAnthropicProvider(
  config: AnthropicProviderConfig,
  deps: { client?: AnthropicClientLike } = {},
): AiProvider {
  const client: AnthropicClientLike = deps.client ?? createAnthropicClient(config);

  function open(
    request: AiTextRequest,
    deadline: AbortSignal,
    format?: BetaJSONOutputFormat,
  ): AnthropicStreamLike {
    try {
      return client.beta.messages.stream(
        buildAnthropicParams(config.model, request, format),
        buildRequestOptions(request, deadline),
      );
    } catch (error) {
      throw toAiError(error, { usage: NO_USAGE, deadlineHit: deadline.aborted });
    }
  }

  // Streaming plus finalMessage(): no HTTP timeout risk, whatever the length of the reply.
  async function finalMessageOf(
    request: AiTextRequest,
    format?: BetaJSONOutputFormat,
  ): Promise<BetaMessage> {
    const deadline = AbortSignal.timeout(DEADLINE_MS[request.purpose]);
    const stream = open(request, deadline, format);
    try {
      return await stream.finalMessage();
    } catch (error) {
      throw toAiError(error, { usage: NO_USAGE, deadlineHit: deadline.aborted });
    }
  }

  return {
    id: 'anthropic',

    async *streamText(request: AiTextRequest): AsyncGenerator<AiStreamEvent, void, void> {
      const deadline = AbortSignal.timeout(DEADLINE_MS[request.purpose]);
      const stream = open(request, deadline);
      let known: AiUsage = NO_USAGE;
      let finished = false;
      try {
        for await (const event of stream) {
          if (event.type === 'message_start') {
            known = toAiUsage(event.message.usage);
          } else if (event.type === 'message_delta') {
            known = { inputTokens: known.inputTokens, outputTokens: event.usage.output_tokens };
          } else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            yield { type: 'text', text: event.delta.text };
          }
        }
        const message = await stream.finalMessage();
        finished = true;
        yield {
          type: 'done',
          usage: toAiUsage(message.usage),
          stopReason: toStopReason(message.stop_reason),
          model: message.model || config.model,
        };
      } catch (error) {
        throw toAiError(error, { usage: known, deadlineHit: deadline.aborted });
      } finally {
        // The consumer stopped early or the call failed: stop the HTTP stream.
        if (!finished) stream.abort();
      }
    },

    async generateText(request: AiTextRequest): Promise<AiTextResult> {
      const message = await finalMessageOf(request);
      return {
        text: collectText(message),
        usage: toAiUsage(message.usage),
        stopReason: toStopReason(message.stop_reason),
        model: message.model || config.model,
      };
    },

    async generateObject<T>(request: AiObjectRequest<T>): Promise<AiObjectResult<T>> {
      // Structured outputs, not forced tool use. The helper moves enums and numeric bounds into
      // descriptions, so the zod validation below is what enforces them (8.1).
      let format: BetaJSONOutputFormat;
      try {
        format = { type: 'json_schema', schema: betaZodOutputFormat(request.schema).schema };
      } catch (cause) {
        throw new AiError('invalid_output', { cause, message: 'anthropic schema not supported' });
      }

      const message = await finalMessageOf(request, format);
      const usage = toAiUsage(message.usage);
      const stopReason = toStopReason(message.stop_reason);
      if (stopReason === 'max_tokens') throw new AiError('incomplete', { usage });
      if (stopReason === 'refusal') throw new AiError('refused', { usage });
      if (stopReason === 'error') {
        throw new AiError('provider_error', {
          usage,
          message: `anthropic stop ${message.stop_reason ?? 'null'}`,
        });
      }

      let json: unknown;
      try {
        json = JSON.parse(collectText(message));
      } catch (cause) {
        throw new AiError('invalid_output', { usage, cause });
      }
      const parsed = request.schema.safeParse(json);
      if (!parsed.success) throw new AiError('invalid_output', { usage, cause: parsed.error });
      return { object: parsed.data, usage, stopReason, model: message.model || config.model };
    },
  };
}
