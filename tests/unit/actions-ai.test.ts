import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runLabToolAction } from '@/actions/ai';
import { runLabToolWithReport } from '@/lib/ai/lab';
import { LAB_NOTICES } from '@/lib/ai/prompts/lab';
import { AiError } from '@/lib/ai/types';
import { assertSessionNotRevoked, getSession } from '@/lib/actions/session-source';
import {
  checkAndCountAiUsage,
  recordAiBlocked,
  recordAiTokens,
  type AiUsageDecision,
} from '@/lib/data/ai-usage';
import { getSchool } from '@/lib/data/schools';
import { NotFoundError } from '@/lib/errors';
import type { Role, School } from '@/types';
import { session as sessionOf } from './services-fixtures';

// WS-I core: runLabToolAction (ARCHITECTURE.md 8.5, 8.7, 10.4). The lab pipeline runs for real
// on the mock provider unless a test scripts it; the usage counters and the school are mocked.

vi.mock('next-intl/server', () => ({ getLocale: vi.fn(() => Promise.resolve('fr')) }));
vi.mock('@/lib/actions/session-source', () => ({
  getSession: vi.fn(),
  assertSessionNotRevoked: vi.fn(),
}));
vi.mock('@/lib/data/ai-usage', () => ({
  checkAndCountAiUsage: vi.fn(),
  recordAiTokens: vi.fn(),
  recordAiBlocked: vi.fn(),
}));
vi.mock('@/lib/data/schools', () => ({ getSchool: vi.fn() }));
vi.mock('@/lib/ai/lab', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai/lab')>();
  return { ...actual, runLabToolWithReport: vi.fn(actual.runLabToolWithReport) };
});

const student = sessionOf('student', 'stu-1', null, [], { ageBand: '13-15' });
const PROMPT = 'Écris un poème sur la lune.';

const ALLOWED: AiUsageDecision = {
  allowed: true,
  reason: 'ok',
  remainingToday: 29,
  retryAfterSeconds: null,
};

function school(aiEnabled: boolean): School {
  return { id: 'school-1', settings: { aiEnabled } } as unknown as School;
}

beforeEach(() => {
  for (const name of ['AI_PROVIDER', 'ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL']) {
    vi.stubEnv(name, undefined);
  }
  vi.mocked(getSession).mockReset().mockResolvedValue(student);
  vi.mocked(assertSessionNotRevoked).mockReset().mockResolvedValue(undefined);
  vi.mocked(checkAndCountAiUsage).mockReset().mockResolvedValue(ALLOWED);
  vi.mocked(recordAiTokens).mockReset().mockResolvedValue(undefined);
  vi.mocked(recordAiBlocked).mockReset().mockResolvedValue(undefined);
  vi.mocked(getSchool).mockReset();
  vi.mocked(runLabToolWithReport).mockClear();
});

const untouched = () => {
  expect(checkAndCountAiUsage).not.toHaveBeenCalled();
  expect(runLabToolWithReport).not.toHaveBeenCalled();
  expect(recordAiTokens).not.toHaveBeenCalled();
};

describe('roles and input', () => {
  it.each(['teacher', 'school_admin', 'platform_admin'] as Role[])('refuses a %s', async (role) => {
    vi.mocked(getSession).mockResolvedValue(sessionOf(role, `${role}-1`));
    expect(await runLabToolAction({ toolId: 'text', prompt: PROMPT })).toEqual({
      ok: false,
      error: { code: 'forbidden' },
    });
    untouched();
  });

  it('answers unauthenticated without a session', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    expect(await runLabToolAction({ toolId: 'text', prompt: PROMPT })).toEqual({
      ok: false,
      error: { code: 'unauthenticated' },
    });
    untouched();
  });

  it.each([
    ['an unknown tool', { toolId: 'nope', prompt: PROMPT }, 'toolId'],
    ['an empty prompt', { toolId: 'text', prompt: '   ' }, 'prompt'],
    ['a prompt that is too long', { toolId: 'text', prompt: 'a'.repeat(2_001) }, 'prompt'],
  ])('refuses %s as validation', async (_label, input, field) => {
    const result = await runLabToolAction(input as never);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('validation');
    expect(result.error.fieldErrors?.[field]?.length).toBeGreaterThan(0);
    untouched();
  });
});

describe('the live tool', () => {
  it('counts the request, runs in the page locale and records the tokens', async () => {
    const result = await runLabToolAction({ toolId: 'text', prompt: PROMPT });

    expect(checkAndCountAiUsage).toHaveBeenCalledWith(student, 'lab');
    expect(runLabToolWithReport).toHaveBeenCalledWith(
      'text',
      { prompt: PROMPT },
      { ageBand: '13-15', locale: 'fr' },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.kind).toBe('text');
    if (result.data.kind !== 'text') return;
    expect(result.data.text).toContain('Mode démo');
    expect(recordAiTokens).toHaveBeenCalledTimes(1);
    const [, usage] = vi.mocked(recordAiTokens).mock.calls[0]!;
    expect(usage.inputTokens + usage.outputTokens).toBeGreaterThan(0);
    expect(recordAiBlocked).not.toHaveBeenCalled();
  });

  it('answers rate_limited with the delay of the daily limit', async () => {
    vi.mocked(checkAndCountAiUsage).mockResolvedValue({
      allowed: false,
      reason: 'limit',
      remainingToday: 0,
      retryAfterSeconds: 3_600,
    });
    expect(await runLabToolAction({ toolId: 'text', prompt: PROMPT })).toEqual({
      ok: false,
      error: { code: 'rate_limited', retryAfterSeconds: 3_600 },
    });
    expect(runLabToolWithReport).not.toHaveBeenCalled();
  });

  it.each(['disabled', 'role'] as const)('answers forbidden for %s', async (reason) => {
    vi.mocked(checkAndCountAiUsage).mockResolvedValue({
      allowed: false,
      reason,
      remainingToday: 0,
      retryAfterSeconds: null,
    });
    expect(await runLabToolAction({ toolId: 'text', prompt: PROMPT })).toEqual({
      ok: false,
      error: { code: 'forbidden' },
    });
    expect(runLabToolWithReport).not.toHaveBeenCalled();
  });

  it('counts a blocked text as blocked', async () => {
    const usage = { inputTokens: 20, outputTokens: 10 };
    vi.mocked(runLabToolWithReport).mockResolvedValueOnce({
      result: { kind: 'text', text: LAB_NOTICES.fr.cannotHelp },
      outcome: 'blocked',
      usage,
    });
    expect(await runLabToolAction({ toolId: 'text', prompt: PROMPT })).toEqual({
      ok: true,
      data: { kind: 'text', text: LAB_NOTICES.fr.cannotHelp },
    });
    expect(recordAiTokens).toHaveBeenCalledWith(student, usage);
    expect(recordAiBlocked).toHaveBeenCalledTimes(1);
  });

  it('answers internal for a provider failure and still records its usage', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const usage = { inputTokens: 12, outputTokens: 3 };
    vi.mocked(runLabToolWithReport).mockRejectedValueOnce(
      new AiError('provider_error', { usage, message: 'anthropic server 500' }),
    );
    expect(await runLabToolAction({ toolId: 'text', prompt: PROMPT })).toEqual({
      ok: false,
      error: { code: 'internal' },
    });
    expect(recordAiTokens).toHaveBeenCalledWith(student, usage);
    expect(recordAiBlocked).not.toHaveBeenCalled();
    const logged = log.mock.calls.map((call) => call.map(String).join(' ')).join('\n');
    expect(logged).toContain('[ai/lab] AiError(provider_error): anthropic server 500');
    expect(logged).not.toContain(PROMPT);
    log.mockRestore();
  });

  it('returns the result even when the accounting fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(recordAiTokens).mockRejectedValue(new Error('firestore down'));
    const result = await runLabToolAction({ toolId: 'text', prompt: PROMPT });
    expect(result.ok).toBe(true);
    expect(log.mock.calls.map((call) => call.join(' '))).toEqual([
      '[ai/lab] usage accounting failed: Error: firestore down',
    ]);
    log.mockRestore();
  });
});

describe('the canned tools', () => {
  it('answer their demo key without counting anything', async () => {
    expect(await runLabToolAction({ toolId: 'image', prompt: PROMPT })).toEqual({
      ok: true,
      data: { kind: 'mock', messageKey: 'tools.image.mockResult' },
    });
    expect(checkAndCountAiUsage).not.toHaveBeenCalled();
    expect(recordAiTokens).not.toHaveBeenCalled();
    expect(getSchool).not.toHaveBeenCalled();
  });

  it('answer comingSoon for a tool that is not ready', async () => {
    const toolId = 'ml-lab';
    expect(await runLabToolAction({ toolId, prompt: PROMPT })).toEqual({
      ok: true,
      data: { kind: 'mock', messageKey: 'comingSoon' },
    });
  });

  it('read the school switch of a learner with a school', async () => {
    const pupil = sessionOf('student', 'stu-2', 'school-1');
    vi.mocked(getSession).mockResolvedValue(pupil);
    vi.mocked(getSchool).mockResolvedValue(school(true));
    expect((await runLabToolAction({ toolId: 'voice', prompt: PROMPT })).ok).toBe(true);
    expect(getSchool).toHaveBeenCalledWith(pupil, 'school-1');
    expect(checkAndCountAiUsage).not.toHaveBeenCalled();
  });

  it.each([
    ['AI switched off', () => vi.mocked(getSchool).mockResolvedValue(school(false))],
    ['a missing school', () => vi.mocked(getSchool).mockRejectedValue(new NotFoundError('x'))],
  ])('answer forbidden with %s', async (_label, arrange) => {
    vi.mocked(getSession).mockResolvedValue(sessionOf('student', 'stu-2', 'school-1'));
    arrange();
    expect(await runLabToolAction({ toolId: 'vision', prompt: PROMPT })).toEqual({
      ok: false,
      error: { code: 'forbidden' },
    });
    expect(runLabToolWithReport).not.toHaveBeenCalled();
  });
});
