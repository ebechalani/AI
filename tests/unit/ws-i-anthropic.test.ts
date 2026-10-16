import Anthropic from '@anthropic-ai/sdk';
import type {
  BetaMessage,
  BetaMessageStreamParams,
  BetaRawMessageStreamEvent,
} from '@anthropic-ai/sdk/resources/beta/messages';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { aiReviewModelSchema } from '@/lib/ai/grading';
import {
  createAnthropicClient,
  createAnthropicProvider,
  type AnthropicClientLike,
  type AnthropicStreamLike,
} from '@/lib/ai/providers/anthropic';
import {
  DEADLINE_MS,
  MAX_RETRIES,
  REQUEST_TIMEOUT_MS,
  SERVER_FALLBACK_BETA,
  supportsServerFallback,
  toAiError,
  toAiUsage,
  toStopReason,
} from '@/lib/ai/providers/anthropic-mapping';
import { guardTutorStream, TUTOR_REPLACE_KEYS, type GuardedTutorEvent } from '@/lib/ai/tutor';
import {
  AiError,
  NO_USAGE,
  type AiObjectRequest,
  type AiPurpose,
  type AiStreamEvent,
  type AiTextRequest,
} from '@/lib/ai/types';

// WS-I core: the Anthropic adapter (ARCHITECTURE.md 8.1) against a scripted SDK client. No
// network call is made anywhere in this file.

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const MODEL = 'claude-opus-5-5';
const PROMPT_TEXT = 'my secret prompt text';

// --- Fakes --------------------------------------------------------------------------------------

type Usage = {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  iterations?: Record<string, unknown>[] | null;
};

function message(
  overrides: { text?: string[]; stop?: string | null; usage?: Usage; model?: string } = {},
): BetaMessage {
  return {
    id: 'msg_1',
    type: 'message',
    role: 'assistant',
    model: overrides.model ?? MODEL,
    content: [
      { type: 'thinking', thinking: '', signature: 'sig' },
      ...(overrides.text ?? ['Hello there.']).map((text) => ({ type: 'text', text })),
    ],
    stop_reason: overrides.stop === undefined ? 'end_turn' : overrides.stop,
    stop_sequence: null,
    usage: { input_tokens: 40, output_tokens: 12, ...overrides.usage },
  } as unknown as BetaMessage;
}

const ev = (event: Record<string, unknown>) => event as unknown as BetaRawMessageStreamEvent;
const start = (usage: Usage) => ev({ type: 'message_start', message: message({ usage }) });
const text = (value: string) =>
  ev({ type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: value } });
const delta = (outputTokens: number) =>
  ev({
    type: 'message_delta',
    delta: { stop_reason: null },
    usage: { output_tokens: outputTokens },
  });

interface Script {
  events?: BetaRawMessageStreamEvent[];
  final?: BetaMessage;
  /** Thrown while iterating, before the event at this index (events.length: after the last). */
  failAt?: number;
  error?: unknown;
}

function scripted(script: Script): AnthropicStreamLike & { aborted: boolean } {
  const events = script.events ?? [];
  const stream = {
    aborted: false,
    async *[Symbol.asyncIterator]() {
      for (let index = 0; index <= events.length; index += 1) {
        if (script.failAt === index) throw script.error;
        const event = events[index];
        if (event !== undefined) yield event;
      }
    },
    finalMessage: () =>
      script.failAt === undefined
        ? Promise.resolve(script.final ?? message())
        : Promise.reject(script.error),
    abort() {
      stream.aborted = true;
    },
  };
  return stream;
}

function fakeClient(script: Script = {}) {
  const calls: { params: BetaMessageStreamParams; options: Record<string, unknown> }[] = [];
  const streams: ReturnType<typeof scripted>[] = [];
  const client: AnthropicClientLike = {
    beta: {
      messages: {
        stream(params, options) {
          calls.push({ params, options: (options ?? {}) as Record<string, unknown> });
          const stream = scripted(script);
          streams.push(stream);
          return stream;
        },
      },
    },
  };
  return { client, calls, streams };
}

function request(purpose: AiPurpose = 'tutor', extra: Partial<AiTextRequest> = {}): AiTextRequest {
  return {
    purpose,
    system: 'ROBOHOLIC-POLICY purpose=tutor version=tutor-2\nYou are Robo AI.',
    messages: [{ role: 'user', content: PROMPT_TEXT }],
    maxOutputTokens: 700,
    ...extra,
  };
}

async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of iterable) items.push(item);
  return items;
}

async function failureOf(promise: Promise<unknown>): Promise<AiError> {
  const error: unknown = await promise.then(
    () => null,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(AiError);
  return error as AiError;
}

// --- Client -------------------------------------------------------------------------------------

describe('the default client', () => {
  it('uses the key alone, never ANTHROPIC_AUTH_TOKEN, and logs at warn at most', () => {
    vi.stubEnv('ANTHROPIC_AUTH_TOKEN', 'env-token');
    vi.stubEnv('ANTHROPIC_LOG', 'debug');
    const client = createAnthropicClient({ apiKey: 'test-key', model: MODEL });
    expect(client.apiKey).toBe('test-key');
    expect(client.authToken).toBeNull();
    expect(client.logLevel).toBe('warn');
    expect(client.maxRetries).toBe(1);
  });

  it('builds a provider without making a request', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const provider = createAnthropicProvider({ apiKey: 'test-key', model: MODEL });
    expect(provider.id).toBe('anthropic');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

// --- Request ------------------------------------------------------------------------------------

describe('the request', () => {
  it.each([
    ['tutor', 8_000, 'low'],
    ['lab', 8_000, 'low'],
    ['review', 16_000, 'medium'],
  ] as const)('has the cap and effort of its purpose (%s)', async (purpose, cap, effort) => {
    const { client, calls } = fakeClient();
    const provider = createAnthropicProvider({ apiKey: 'k', model: MODEL }, { client });
    await provider.generateText(request(purpose));

    const { params, options } = calls[0]!;
    expect(params.model).toBe(MODEL);
    expect(params.max_tokens).toBe(cap);
    expect(params.system).toEqual([
      { type: 'text', text: request(purpose).system, cache_control: { type: 'ephemeral' } },
    ]);
    expect(params.messages).toEqual([{ role: 'user', content: PROMPT_TEXT }]);
    expect(params.output_config).toEqual({ effort });
    for (const absent of ['thinking', 'temperature', 'top_p', 'top_k', 'metadata', 'tools']) {
      expect(params, absent).not.toHaveProperty(absent);
    }
    expect(JSON.stringify(params)).not.toContain('700');
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(options.timeout).toBe(REQUEST_TIMEOUT_MS[purpose]);
    expect(options.maxRetries).toBe(MAX_RETRIES[purpose]);
  });

  it('asks for the server-side refusal fallback on the models that support it', async () => {
    const opus = fakeClient();
    await createAnthropicProvider(
      { apiKey: 'k', model: MODEL },
      { client: opus.client },
    ).generateText(request());
    expect(opus.calls[0]?.params).toMatchObject({
      betas: [SERVER_FALLBACK_BETA],
      fallbacks: 'default',
    });
    expect(SERVER_FALLBACK_BETA).toBe('server-side-fallback-2026-07-01');

    const haiku = fakeClient();
    await createAnthropicProvider(
      { apiKey: 'k', model: 'claude-haiku-5-5' },
      { client: haiku.client },
    ).generateText(request());
    expect(haiku.calls[0]?.params).not.toHaveProperty('betas');
    expect(haiku.calls[0]?.params).not.toHaveProperty('fallbacks');
    expect(supportsServerFallback('claude-haiku-5-5')).toBe(false);
  });

  it('passes the caller’s abort on to the SDK', async () => {
    const controller = new AbortController();
    const { client, calls } = fakeClient();
    await createAnthropicProvider({ apiKey: 'k', model: MODEL }, { client }).generateText(
      request('tutor', { signal: controller.signal }),
    );
    const signal = calls[0]?.options.signal as AbortSignal;
    expect(signal.aborted).toBe(false);
    controller.abort();
    expect(signal.aborted).toBe(true);
  });

  it('keeps every whole-call deadline below the limits around it', () => {
    expect(DEADLINE_MS.tutor).toBeLessThan(60_000);
    expect(DEADLINE_MS.lab).toBeLessThan(60_000);
    expect(DEADLINE_MS.review).toBeLessThan(2 * 60 * 1000);
  });
});

// --- Mapping ------------------------------------------------------------------------------------

describe('stop reasons and usage', () => {
  it.each([
    ['end_turn', 'end'],
    ['stop_sequence', 'end'],
    ['max_tokens', 'max_tokens'],
    ['model_context_window_exceeded', 'max_tokens'],
    ['refusal', 'refusal'],
    ['tool_use', 'error'],
    ['pause_turn', 'error'],
    ['compaction', 'error'],
    [null, 'error'],
    ['something_new', 'error'],
  ] as const)('maps %s to %s', (reason, expected) => {
    expect(toStopReason(reason)).toBe(expected);
  });

  it('sums every iteration, cache tokens included, whatever its type', () => {
    expect(
      toAiUsage({
        input_tokens: 5,
        output_tokens: 5,
        iterations: [
          { type: 'message', input_tokens: 100, output_tokens: 10, cache_read_input_tokens: 400 },
          {
            type: 'fallback_message',
            input_tokens: 120,
            output_tokens: 30,
            cache_creation_input_tokens: 50,
          },
          { type: 'compaction', input_tokens: 7, output_tokens: 3 },
        ],
      }),
    ).toEqual({ inputTokens: 677, outputTokens: 43 });
  });

  it('uses the top-level fields without iterations, and nothing for nothing', () => {
    expect(
      toAiUsage({
        input_tokens: 10,
        output_tokens: 4.6,
        cache_creation_input_tokens: 20,
        cache_read_input_tokens: null,
        iterations: [],
      }),
    ).toEqual({ inputTokens: 30, outputTokens: 5 });
    expect(toAiUsage({ input_tokens: -3, output_tokens: Number.NaN })).toEqual(NO_USAGE);
    expect(toAiUsage(null)).toEqual(NO_USAGE);
  });
});

// --- streamText ---------------------------------------------------------------------------------

describe('streamText', () => {
  it('yields only text deltas, in order, then exactly one done', async () => {
    const { client, streams } = fakeClient({
      events: [
        start({ input_tokens: 30, output_tokens: 1 }),
        ev({ type: 'content_block_start', index: 0, content_block: { type: 'thinking' } }),
        ev({
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'thinking_delta', thinking: 'hm' },
        }),
        ev({ type: 'content_block_start', index: 1, content_block: { type: 'fallback' } }),
        text('Hello '),
        ev({
          type: 'content_block_delta',
          index: 2,
          delta: { type: 'input_json_delta', partial_json: '{' },
        }),
        text('world.'),
        delta(9),
      ],
      final: message({
        model: 'claude-opus-5-5-served',
        usage: {
          input_tokens: 1,
          output_tokens: 1,
          iterations: [
            { type: 'message', input_tokens: 30, output_tokens: 4 },
            { type: 'fallback_message', input_tokens: 31, output_tokens: 5 },
          ],
        },
      }),
    });
    const provider = createAnthropicProvider({ apiKey: 'k', model: MODEL }, { client });
    const events = await collect(provider.streamText(request()));

    expect(events).toEqual([
      { type: 'text', text: 'Hello ' },
      { type: 'text', text: 'world.' },
      {
        type: 'done',
        usage: { inputTokens: 61, outputTokens: 9 },
        stopReason: 'end',
        model: 'claude-opus-5-5-served',
      },
    ]);
    expect(streams[0]?.aborted).toBe(false);
  });

  it('falls back to the configured model when the message names none', async () => {
    const { client } = fakeClient({ final: message({ model: '' }) });
    const events = await collect(
      createAnthropicProvider({ apiKey: 'k', model: MODEL }, { client }).streamText(request()),
    );
    expect(events.at(-1)).toMatchObject({ type: 'done', model: MODEL });
  });

  it('stops the HTTP stream when the consumer stops early', async () => {
    const { client, streams } = fakeClient({ events: [text('One. '), text('Two.')] });
    const provider = createAnthropicProvider({ apiKey: 'k', model: MODEL }, { client });
    for await (const event of provider.streamText(request())) {
      expect(event).toEqual({ type: 'text', text: 'One. ' });
      break;
    }
    expect(streams[0]?.aborted).toBe(true);
  });
});

// --- Failures -----------------------------------------------------------------------------------

const secret = `failed: sk-ant-xyz ${PROMPT_TEXT}`;
const headers = () => new Headers({ 'request-id': 'req_42' });

describe('failures', () => {
  it.each([
    [
      'a rate limit',
      new Anthropic.RateLimitError(429, {}, secret, headers()),
      'anthropic rate_limited 429 request req_42',
    ],
    [
      'a refused key',
      new Anthropic.AuthenticationError(401, {}, secret, headers()),
      'anthropic auth 401 request req_42',
    ],
    [
      'a forbidden key',
      new Anthropic.PermissionDeniedError(403, {}, secret, headers()),
      'anthropic auth 403 request req_42',
    ],
    [
      'an overload',
      Anthropic.APIError.generate(529, {}, secret, headers()),
      'anthropic overloaded 529 request req_42',
    ],
    [
      'a server error',
      Anthropic.APIError.generate(500, {}, secret, headers()),
      'anthropic server 500 request req_42',
    ],
    [
      'a bad request',
      Anthropic.APIError.generate(400, {}, secret, new Headers()),
      'anthropic bad_request 400',
    ],
    [
      'an unknown model',
      Anthropic.APIError.generate(404, {}, secret, new Headers()),
      'anthropic bad_request 404',
    ],
    [
      'a lost connection',
      new Anthropic.APIConnectionError({ message: secret }),
      'anthropic connection',
    ],
    [
      'a timeout',
      new Anthropic.APIConnectionTimeoutError({ message: secret }),
      'anthropic timeout',
    ],
    ['an abort', new Anthropic.APIUserAbortError({ message: secret }), 'anthropic aborted'],
    ['anything else', new TypeError(secret), 'anthropic unexpected'],
  ])('turns %s into a provider_error that leaks nothing', async (_label, error, expected) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { client, streams } = fakeClient({
      events: [start({ input_tokens: 50, output_tokens: 1 }), text('Partial. '), delta(6)],
      failAt: 3,
      error,
    });
    const provider = createAnthropicProvider({ apiKey: 'k', model: MODEL }, { client });

    const failure = await failureOf(collect(provider.streamText(request())));
    expect(failure.reason).toBe('provider_error');
    expect(failure.message).toBe(expected);
    expect(failure.message).not.toContain('sk-ant');
    expect(failure.message).not.toContain(PROMPT_TEXT);
    expect(failure.cause).toBe(error);
    expect(failure.usage).toEqual({ inputTokens: 50, outputTokens: 6 });
    expect(streams[0]?.aborted).toBe(true);
  });

  it('names a deadline that passed', () => {
    expect(
      toAiError(new Anthropic.APIUserAbortError(), { usage: NO_USAGE, deadlineHit: true }).message,
    ).toBe('anthropic deadline');
  });

  it('reports a refused key once per process, never the key itself', async () => {
    vi.resetModules();
    const { default: SDK } = await import('@anthropic-ai/sdk');
    const mapping = await import('@/lib/ai/providers/anthropic-mapping');
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    for (let index = 0; index < 3; index += 1) {
      mapping.toAiError(new SDK.AuthenticationError(401, {}, secret, new Headers()), {
        usage: NO_USAGE,
        deadlineHit: false,
      });
    }
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]?.join(' ')).toContain('ANTHROPIC_API_KEY');
    expect(log.mock.calls[0]?.join(' ')).not.toContain('sk-ant');
  });

  it('lets an AiError through unchanged', () => {
    const error = new AiError('refused');
    expect(toAiError(error, { usage: NO_USAGE, deadlineHit: false })).toBe(error);
  });

  it('turns a failed generateText into a provider_error without usage', async () => {
    const { client } = fakeClient({
      failAt: 0,
      error: new Anthropic.APIConnectionError({ message: secret }),
    });
    const failure = await failureOf(
      createAnthropicProvider({ apiKey: 'k', model: MODEL }, { client }).generateText(
        request('lab'),
      ),
    );
    expect(failure.message).toBe('anthropic connection');
    expect(failure.usage).toEqual(NO_USAGE);
  });
});

// --- generateText and generateObject ------------------------------------------------------------

describe('generateText', () => {
  it('joins the text blocks and maps the stop reason and usage', async () => {
    const { client } = fakeClient({
      final: message({
        text: ['Once upon ', 'a time.'],
        stop: 'max_tokens',
        usage: { input_tokens: 20, output_tokens: 8, cache_read_input_tokens: 100 },
      }),
    });
    expect(
      await createAnthropicProvider({ apiKey: 'k', model: MODEL }, { client }).generateText(
        request('lab'),
      ),
    ).toEqual({
      text: 'Once upon a time.',
      usage: { inputTokens: 120, outputTokens: 8 },
      stopReason: 'max_tokens',
      model: MODEL,
    });
  });
});

const REVIEW = {
  criteria: {
    creativity: { score: 80, comment: 'Original.' },
    technicalQuality: { score: 70, comment: 'Works.' },
    understanding: { score: 75, comment: 'Clear.' },
    responsibleAi: { score: 60, comment: 'Some thought.' },
  },
  writtenFeedback: 'Good work.',
  strengths: ['Idea'],
  improvements: ['Testing'],
  confidence: 'medium',
  limitations: [],
  flags: [],
};

function objectRequest(): AiObjectRequest<unknown> {
  return { ...request('review'), schema: aiReviewModelSchema, schemaName: 'ai_review' };
}

describe('generateObject', () => {
  it('asks for a strict JSON schema, never forced tool use, and validates the reply', async () => {
    const { client, calls } = fakeClient({ final: message({ text: [JSON.stringify(REVIEW)] }) });
    const result = await createAnthropicProvider(
      { apiKey: 'k', model: MODEL },
      { client },
    ).generateObject(objectRequest());

    expect(result.object).toEqual(REVIEW);
    expect(result.stopReason).toBe('end');
    const config = calls[0]?.params.output_config;
    expect(config?.effort).toBe('medium');
    expect(config?.format?.type).toBe('json_schema');
    expect(config?.format?.schema.additionalProperties).toBe(false);
    expect(calls[0]?.params).not.toHaveProperty('tools');
    expect(calls[0]?.params).not.toHaveProperty('tool_choice');
  });

  it.each([
    ['invalid JSON', message({ text: ['{"criteria":'] }), 'invalid_output'],
    [
      'a schema mismatch',
      message({ text: [JSON.stringify({ ...REVIEW, confidence: 'total' })] }),
      'invalid_output',
    ],
    ['the output cap', message({ text: ['{'], stop: 'max_tokens' }), 'incomplete'],
    ['a refusal', message({ text: [''], stop: 'refusal' }), 'refused'],
    ['a tool_use stop', message({ text: [''], stop: 'tool_use' }), 'provider_error'],
  ] as const)('fails on %s with the usage', async (_label, final, reason) => {
    const { client } = fakeClient({ final });
    const failure = await failureOf(
      createAnthropicProvider({ apiKey: 'k', model: MODEL }, { client }).generateObject(
        objectRequest(),
      ),
    );
    expect(failure.reason).toBe(reason);
    expect(failure.usage).toEqual({ inputTokens: 40, outputTokens: 12 });
  });
});

// --- With the tutor guard -----------------------------------------------------------------------

describe('with guardTutorStream', () => {
  async function guarded(script: Script): Promise<GuardedTutorEvent[]> {
    const { client } = fakeClient(script);
    const provider = createAnthropicProvider({ apiKey: 'k', model: MODEL }, { client });
    return collect(
      guardTutorStream(provider.streamText(request()) as AsyncIterable<AiStreamEvent>, '13-15'),
    );
  }

  it('keeps the partial usage of a stream that fails after one paragraph', async () => {
    const events = await guarded({
      events: [
        start({ input_tokens: 90, output_tokens: 1 }),
        text('First paragraph.\n\n'),
        delta(7),
        text('Second'),
      ],
      failAt: 4,
      error: new Anthropic.APIConnectionError({ message: 'reset' }),
    });
    expect(events[0]).toEqual({ type: 'text', text: 'First paragraph.\n\n' });
    const done = events.at(-1);
    expect(done).toMatchObject({
      type: 'done',
      outcome: 'cut_short',
      usage: { inputTokens: 90, outputTokens: 7 },
      stopReason: 'error',
    });
  });

  it('shows the neutral message for a refusal that arrives mid-stream', async () => {
    const events = await guarded({
      events: [start({ input_tokens: 10, output_tokens: 1 }), text('Here is how.\n\n')],
      final: message({ stop: 'refusal' }),
    });
    expect(events).toContainEqual({ type: 'replace', messageKey: TUTOR_REPLACE_KEYS.cannotHelp });
    expect(events.at(-1)).toMatchObject({ type: 'done', outcome: 'refused' });
  });
});
