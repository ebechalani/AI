import { describe, expect, it } from 'vitest';
import {
  groupLabTools,
  isMockToolId,
  keepRecent,
  KEPT_RUNS,
  labFailureOf,
  labToolHref,
  mockMessageKey,
  MOCK_TOOL_OPTIONS,
  STATUS_TONE,
  type LabRun,
} from '@/components/ai/lab-model';
import { labMessageKeys } from '@/lib/ai/lab';
import { isLabToolId, LAB_TOOL_IDS, LAB_TOOLS } from '@/lib/ai/lab-tools';

const run = (id: number): LabRun => ({
  id,
  prompt: `prompt ${id}`,
  option: null,
  result: { kind: 'text', text: `text ${id}` },
});

describe('groupLabTools', () => {
  it('splits the registry into tools to try and tools to come, in registry order', () => {
    const { available, comingSoon } = groupLabTools();
    expect(available.map((tool) => tool.id)).toEqual([
      'text',
      'image',
      'video',
      'voice',
      'vision',
      'chatbot-builder',
    ]);
    expect(comingSoon.map((tool) => tool.id)).toEqual(['ml-lab', 'agent-builder']);
  });

  it('links a tool by its id', () => {
    expect(labToolHref('vision')).toBe('/student/ai-lab/vision');
  });

  it('has a chip tone for every status', () => {
    for (const tool of LAB_TOOLS) expect(STATUS_TONE[tool.status]).toBeTypeOf('string');
  });
});

describe('demo tools', () => {
  it('recognises exactly the mock tools', () => {
    const mockIds = LAB_TOOLS.filter((tool) => tool.status === 'mock').map((tool) => tool.id);
    expect(Object.keys(MOCK_TOOL_OPTIONS).sort()).toEqual([...mockIds].sort());
    for (const id of LAB_TOOL_IDS) expect(isMockToolId(id), id).toBe(mockIds.includes(id));
    expect(isMockToolId('text')).toBe(false);
    expect(isMockToolId('ml-lab')).toBe(false);
    expect(isMockToolId('agent-builder')).toBe(false);
  });

  it('offers at least two choices per demo tool', () => {
    for (const choices of Object.values(MOCK_TOOL_OPTIONS)) {
      expect(choices.length).toBeGreaterThanOrEqual(2);
      expect(new Set(choices).size).toBe(choices.length);
    }
  });

  it('renders only the result keys the action may send', () => {
    expect(mockMessageKey('image', labMessageKeys.mockResult('image'))).toBe(
      'tools.image.mockResult',
    );
    expect(mockMessageKey('image', labMessageKeys.comingSoon)).toBe('comingSoon');
    expect(mockMessageKey('image', 'tools.text.mockResult')).toBe('unavailable');
    expect(mockMessageKey('image', 'disabled.title')).toBe('unavailable');
  });
});

describe('isLabToolId', () => {
  it('accepts every registry id and nothing else', () => {
    for (const id of LAB_TOOL_IDS) expect(isLabToolId(id), id).toBe(true);
    for (const value of ['nope', 'constructor', '', 'TEXT', '__proto__']) {
      expect(isLabToolId(value), value).toBe(false);
    }
  });
});

describe('keepRecent', () => {
  it('keeps the newest runs first, at most three', () => {
    let runs: LabRun[] = [];
    for (let id = 1; id <= 5; id += 1) runs = keepRecent(runs, run(id));
    expect(KEPT_RUNS).toBe(3);
    expect(runs.map((entry) => entry.id)).toEqual([5, 4, 3]);
    expect(keepRecent([], run(9)).map((entry) => entry.id)).toEqual([9]);
  });
});

describe('labFailureOf', () => {
  it('shows a prompt problem under the field', () => {
    expect(labFailureOf({ code: 'validation', fieldErrors: { prompt: ['too_long'] } })).toEqual({
      kind: 'field',
      key: 'too_long',
    });
  });

  it('shows other failures as a toast or a lasting alert', () => {
    expect(labFailureOf({ code: 'validation' })).toEqual({ kind: 'toast' });
    expect(labFailureOf({ code: 'validation', fieldErrors: { toolId: ['invalid'] } })).toEqual({
      kind: 'toast',
    });
    expect(labFailureOf({ code: 'rate_limited', retryAfterSeconds: 3_600 })).toEqual({
      kind: 'limit',
    });
    expect(labFailureOf({ code: 'rate_limited' })).toEqual({ kind: 'limit' });
    expect(labFailureOf({ code: 'rate_limited', retryAfterSeconds: 30 })).toEqual({
      kind: 'toast',
    });
    expect(labFailureOf({ code: 'forbidden' })).toEqual({ kind: 'disabled' });
    expect(labFailureOf({ code: 'internal' })).toEqual({ kind: 'toast' });
    expect(labFailureOf({ code: 'unauthenticated' })).toEqual({ kind: 'toast' });
    expect(labFailureOf({ code: 'not_implemented' })).toEqual({ kind: 'toast' });
  });
});
