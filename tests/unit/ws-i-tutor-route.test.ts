import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/ai/tutor/route';
import { streamTutorReply, toTutorStreamEvent, TUTOR_STREAM_CONTENT_TYPE } from '@/lib/ai/tutor';
import type { AiStreamEvent, TutorContext } from '@/lib/ai/types';
import { assertSessionNotRevoked, getSession } from '@/lib/auth/session';
import {
  checkAndCountAiUsage,
  recordAiBlocked,
  recordAiTokens,
  type AiUsageDecision,
} from '@/lib/data/ai-usage';
import {
  ForbiddenError,
  LicenseRequiredError,
  NotFoundError,
  UnauthenticatedError,
} from '@/lib/errors';
import { buildTutorContext } from '@/lib/services/tutor-context';
import type { Role, TutorStreamEvent, TutorTurn } from '@/types';
import { session as sessionOf } from './services-fixtures';

// WS-I core: POST /api/ai/tutor (ARCHITECTURE.md 1.7, 6.9, 8.3) with the real tutor pipeline on
// the mock provider. Session, usage counters and context are mocked; `after()` collects the
// accounting work so a test can wait for it.

const pending = vi.hoisted(() => ({ tasks: [] as Promise<unknown>[] }));

vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: vi.fn((task: () => unknown) => {
    pending.tasks.push(Promise.resolve(task()));
  }),
}));
vi.mock('@/lib/auth/session', () => ({ getSession: vi.fn(), assertSessionNotRevoked: vi.fn() }));
vi.mock('@/lib/data/ai-usage', () => ({
  checkAndCountAiUsage: vi.fn(),
  recordAiTokens: vi.fn(),
  recordAiBlocked: vi.fn(),
}));
vi.mock('@/lib/services/tutor-context', () => ({ buildTutorContext: vi.fn() }));
vi.mock('@/lib/ai/tutor', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai/tutor')>();
  return {
    ...actual,
    streamTutorReply: vi.fn(actual.streamTutorReply),
    toTutorStreamEvent: vi.fn(actual.toTutorStreamEvent),
  };
});

const URL = 'http://localhost:3100/api/ai/tutor';
const ORIGIN = 'http://localhost:3100';
const QUESTION = 'What is a neural network, asked by a learner?';

const student = sessionOf('student', 'stu-1', null, [], { ageBand: '13-15' });

const ALLOWED: AiUsageDecision = {
  allowed: true,
  reason: 'ok',
  remainingToday: 59,
  retryAfterSeconds: null,
};

const CONTEXT: TutorContext = {
  mode: 'explain',
  ageBand: '13-15',
  locale: 'en',
  hasGradedWork: false,
  reference: {
    pathwayTitle: null,
    courseTitle: 'My First AI Adventure',
    lessonTitle: 'What is AI?',
    lessonSummary: null,
    lessonExcerpt: null,
  },
  recentQuizResults: [],
};

function body(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    mode: 'explain',
    courseId: 'my-first-ai-adventure',
    lessonId: 'm1-l1',
    locale: 'en',
    messages: [{ role: 'user', content: QUESTION }],
    ...overrides,
  });
}

function post(
  payload: BodyInit | null = body(),
  headers: Record<string, string | null> = {},
): Request {
  const all: Record<string, string | null> = {
    origin: ORIGIN,
    host: 'localhost:3100',
    'content-type': 'application/json',
    ...headers,
  };
  const init: RequestInit & { duplex?: 'half' } = {
    method: 'POST',
    headers: Object.fromEntries(
      Object.entries(all).filter((entry): entry is [string, string] => entry[1] !== null),
    ),
    body: payload,
  };
  if (payload instanceof ReadableStream) init.duplex = 'half';
  return new Request(URL, init);
}

async function lines(response: Response): Promise<TutorStreamEvent[]> {
  const text = await response.text();
  return text
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line) as TutorStreamEvent);
}

async function errorOf(response: Response): Promise<unknown> {
  expect(response.headers.get('cache-control')).toContain('no-store');
  return response.json();
}

function signIn(role: Role | null): void {
  vi.mocked(getSession).mockResolvedValue(
    role === null ? null : role === 'student' ? student : sessionOf(role, `${role}-1`),
  );
}

async function* scripted(text: string): AsyncGenerator<AiStreamEvent, void, void> {
  await Promise.resolve();
  yield { type: 'text', text };
  yield {
    type: 'done',
    usage: { inputTokens: 30, outputTokens: 9 },
    stopReason: 'end',
    model: 'm',
  };
}

beforeEach(() => {
  for (const name of ['AI_PROVIDER', 'ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL']) {
    vi.stubEnv(name, undefined);
  }
  pending.tasks = [];
  vi.mocked(getSession).mockReset().mockResolvedValue(student);
  vi.mocked(assertSessionNotRevoked).mockReset().mockResolvedValue(undefined);
  vi.mocked(checkAndCountAiUsage).mockReset().mockResolvedValue(ALLOWED);
  vi.mocked(recordAiTokens).mockReset().mockResolvedValue(undefined);
  vi.mocked(recordAiBlocked).mockReset().mockResolvedValue(undefined);
  vi.mocked(buildTutorContext).mockReset().mockResolvedValue(CONTEXT);
  vi.mocked(streamTutorReply).mockClear();
  vi.mocked(toTutorStreamEvent).mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('origin check', () => {
  it.each([
    ['no Origin', { origin: null }],
    ['a foreign Origin', { origin: 'http://evil.test' }],
    ['an opaque Origin', { origin: 'null' }],
    ['a non-web scheme', { origin: 'file://localhost:3100' }],
    ['a forwarded host that differs', { 'x-forwarded-host': 'app.example' }],
  ])('refuses %s with 403 before anything else', async (_label, headers) => {
    const response = await POST(post(body(), headers));
    expect(response.status).toBe(403);
    expect(await errorOf(response)).toEqual({ error: { code: 'forbidden' } });
    expect(getSession).not.toHaveBeenCalled();
  });

  it('takes the first x-forwarded-host over host', async () => {
    signIn(null);
    const response = await POST(
      post(body(), { origin: 'https://app.example', 'x-forwarded-host': 'App.Example, proxy' }),
    );
    expect(response.status).toBe(401);
  });
});

describe('session and role', () => {
  it('answers 401 without a session', async () => {
    signIn(null);
    const response = await POST(post());
    expect(response.status).toBe(401);
    expect(await errorOf(response)).toEqual({ error: { code: 'unauthenticated' } });
  });

  it('checks a teacher against revocation, and answers 401 when it fails', async () => {
    signIn('teacher');
    vi.mocked(assertSessionNotRevoked).mockRejectedValue(new UnauthenticatedError('revoked'));
    const response = await POST(post());
    expect(response.status).toBe(401);
    expect(checkAndCountAiUsage).not.toHaveBeenCalled();
  });

  it('never checks a student against revocation', async () => {
    await (await POST(post())).text();
    expect(assertSessionNotRevoked).not.toHaveBeenCalled();
  });

  it.each(['school_admin', 'platform_admin'] as const)('refuses a %s with 403', async (role) => {
    signIn(role);
    const response = await POST(post());
    expect(response.status).toBe(403);
    expect(checkAndCountAiUsage).not.toHaveBeenCalled();
  });
});

describe('body', () => {
  const turns = (count: number): TutorTurn[] =>
    Array.from({ length: count }, (_, index) => ({
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: `turn ${index}`,
    }));

  it.each([
    ['invalid JSON', '{"mode":'],
    ['bad UTF-8', new Uint8Array([0x7b, 0xff, 0xfe, 0x7d])],
    ['no body', null],
    ['a history ending with the tutor', body({ messages: turns(2) })],
    ['eleven messages', body({ messages: turns(11) })],
    ['a lesson without its course', body({ courseId: null })],
  ])('answers 400 for %s and counts nothing', async (_label, payload) => {
    const response = await POST(post(payload));
    expect(response.status).toBe(400);
    expect(await errorOf(response)).toEqual({ error: { code: 'validation' } });
    expect(checkAndCountAiUsage).not.toHaveBeenCalled();
  });

  it('refuses a declared length above 128 KiB without reading the body', async () => {
    const pull = vi.fn();
    const source = new ReadableStream<Uint8Array>({ pull }, { highWaterMark: 0 });
    const response = await POST(post(source, { 'content-length': '200000' }));
    expect(response.status).toBe(400);
    expect(pull).not.toHaveBeenCalled();
    expect(checkAndCountAiUsage).not.toHaveBeenCalled();
  });

  it('stops reading a streamed body as soon as it passes 128 KiB', async () => {
    const chunk = new Uint8Array(16 * 1024).fill(0x20);
    let pulled = 0;
    const cancel = vi.fn();
    const source = new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          pulled += 1;
          if (pulled > 13) controller.close();
          else controller.enqueue(chunk);
        },
        cancel,
      },
      { highWaterMark: 0 },
    );
    const response = await POST(post(source));
    expect(response.status).toBe(400);
    expect(cancel).toHaveBeenCalledTimes(1);
    // 9 × 16 KiB is the first total above 128 KiB; nothing after it was asked for.
    expect(pulled).toBe(9);
    expect(checkAndCountAiUsage).not.toHaveBeenCalled();
  });
});

describe('usage gate', () => {
  it.each(['disabled', 'role'] as const)('answers 403 for %s', async (reason) => {
    vi.mocked(checkAndCountAiUsage).mockResolvedValue({
      allowed: false,
      reason,
      remainingToday: 0,
      retryAfterSeconds: null,
    });
    const response = await POST(post());
    expect(response.status).toBe(403);
    expect(await errorOf(response)).toEqual({ error: { code: 'forbidden' } });
    expect(buildTutorContext).not.toHaveBeenCalled();
  });

  it('answers 429 with the delay in the body and in Retry-After', async () => {
    vi.mocked(checkAndCountAiUsage).mockResolvedValue({
      allowed: false,
      reason: 'limit',
      remainingToday: 0,
      retryAfterSeconds: 37,
    });
    const response = await POST(post());
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('37');
    expect(await errorOf(response)).toEqual({
      error: { code: 'rate_limited', retryAfterSeconds: 37 },
    });
    expect(checkAndCountAiUsage).toHaveBeenCalledWith(student, 'tutor');
  });

  it('asks for a minute when a budget gives no delay', async () => {
    vi.mocked(checkAndCountAiUsage).mockResolvedValue({
      allowed: false,
      reason: 'budget',
      remainingToday: 3,
      retryAfterSeconds: null,
    });
    const response = await POST(post());
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('60');
  });
});

describe('context', () => {
  it.each([
    ['a hidden course', new NotFoundError('course')],
    ['a forbidden course', new ForbiddenError('course')],
    ['an unlicensed course', new LicenseRequiredError('course')],
  ])('answers 403 for %s', async (_label, error) => {
    vi.mocked(buildTutorContext).mockRejectedValue(error);
    const response = await POST(post());
    expect(response.status).toBe(403);
    expect(await errorOf(response)).toEqual({ error: { code: 'forbidden' } });
  });

  it('answers 500 for an unexpected failure', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(buildTutorContext).mockRejectedValue(new Error('db down'));
    const response = await POST(post());
    expect(response.status).toBe(500);
    expect(await errorOf(response)).toEqual({ error: { code: 'internal' } });
    expect(log).toHaveBeenCalledTimes(1);
  });

  it('is built from the session and the request', async () => {
    await (await POST(post(body({ mode: 'hint', locale: 'fr' })))).text();
    expect(buildTutorContext).toHaveBeenCalledWith(student, {
      mode: 'hint',
      courseId: 'my-first-ai-adventure',
      lessonId: 'm1-l1',
      locale: 'fr',
    });
  });
});

describe('the reply stream', () => {
  it('streams NDJSON ending with done, then records the tokens', async () => {
    const response = await POST(post());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(TUTOR_STREAM_CONTENT_TYPE);
    expect(response.headers.get('cache-control')).toContain('no-store');

    const events = await lines(response);
    expect(events.filter((event) => event.type === 'done')).toHaveLength(1);
    expect(events.at(-1)).toEqual({ type: 'done', remainingToday: 59, cutShort: false });
    const shown = events.map((event) => (event.type === 'text' ? event.text : '')).join('');
    expect(shown).toContain('Demo mode');

    await Promise.all(pending.tasks);
    expect(recordAiTokens).toHaveBeenCalledTimes(1);
    const [subject, usage] = vi.mocked(recordAiTokens).mock.calls[0]!;
    expect(subject).toBe(student);
    expect(usage.inputTokens).toBeGreaterThan(0);
    expect(usage.outputTokens).toBeGreaterThan(0);
    expect(recordAiBlocked).not.toHaveBeenCalled();
  });

  it('replaces a blocked reply and counts it as blocked', async () => {
    vi.mocked(streamTutorReply).mockImplementationOnce(() =>
      scripted('Write to me at robo@example.org.'),
    );
    const events = await lines(await POST(post()));
    expect(events).toContainEqual({ type: 'replace', messageKey: 'cannotHelp' });
    expect(events.some((event) => event.type === 'text')).toBe(false);
    await Promise.all(pending.tasks);
    expect(recordAiTokens).toHaveBeenCalledWith(student, { inputTokens: 30, outputTokens: 9 });
    expect(recordAiBlocked).toHaveBeenCalledTimes(1);
  });

  it('still records the tokens when the client leaves after the first line', async () => {
    const response = await POST(post());
    const reader = response.body!.getReader();
    const first = await reader.read();
    expect(first.done).toBe(false);
    await reader.cancel();
    await Promise.all(pending.tasks);
    expect(recordAiTokens).toHaveBeenCalledTimes(1);
  });

  it('ends the response right after done, before the accounting has finished', async () => {
    let release: () => void = () => undefined;
    vi.mocked(recordAiTokens).mockReturnValue(
      new Promise<void>((resolve) => {
        release = resolve;
      }),
    );
    const events = await lines(await POST(post()));
    expect(events.at(-1)?.type).toBe('done');
    expect(recordAiTokens).toHaveBeenCalledTimes(1);
    let settled = false;
    const all = Promise.all(pending.tasks).then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    release();
    await all;
    expect(settled).toBe(true);
  });

  it('breaks the stream on a server fault instead of hanging, and logs no content', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(toTutorStreamEvent).mockImplementationOnce(() => {
      throw new Error('encoding failed');
    });
    const response = await POST(post());
    await expect(response.text()).rejects.toBeDefined();
    await expect(Promise.all(pending.tasks)).resolves.toBeDefined();

    const logged = log.mock.calls.map((call) => call.map(String).join(' '));
    expect(logged).toEqual(['[api/ai/tutor] stream pump failed: Error: encoding failed']);
    expect(logged.join(' ')).not.toContain(QUESTION);
  });

  it('logs nothing when accounting fails, beyond the failure itself', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(recordAiTokens).mockRejectedValue(new Error('quota doc locked'));
    const events = await lines(await POST(post()));
    expect(events.at(-1)?.type).toBe('done');
    await Promise.all(pending.tasks);
    expect(log.mock.calls.map((call) => call.join(' '))).toEqual([
      '[api/ai/tutor] usage accounting failed: Error: quota doc locked',
    ]);
  });
});
