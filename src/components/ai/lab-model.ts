import type { ChipTone } from '@/components/ui';
import { LAB_TOOLS, type LabTool, type LabToolId, type LabToolStatus } from '@/lib/ai/lab-tools';
import type { ActionError } from '@/types/actions';

// The AI Lab as pure data (ARCHITECTURE.md 8.5): tool grouping, links, the demo tools' choices,
// the result keys the page may render, and how an action failure is shown. No React.

export type MockLabToolId = 'image' | 'video' | 'voice' | 'vision' | 'chatbot-builder';

/** The choice each demo tool offers (aiLab.tools.<id>.options.<value>). UI only: never sent. */
export const MOCK_TOOL_OPTIONS: Record<MockLabToolId, readonly string[]> = {
  image: ['cartoon', 'watercolor', 'pixel'],
  video: ['short', 'long'],
  voice: ['robot', 'friendly', 'calm'],
  vision: ['park', 'street', 'kitchen'],
  'chatbot-builder': ['friendly', 'curious', 'funny'],
};

/** aiLab.tools.text.examples.<key>: prompts a learner can start from. */
export const TEXT_EXAMPLE_KEYS = ['story', 'poem', 'explain'] as const;

/** Results kept on the page during a visit (nothing is stored: product question Q12). */
export const KEPT_RUNS = 3;

/** A lab request that asks to wait at most this long is transient: the lab has no per-minute limit. */
const TRANSIENT_RETRY_SECONDS = 60;

export const STATUS_TONE: Record<LabToolStatus, ChipTone> = {
  live: 'success',
  mock: 'accent',
  coming_soon: 'neutral',
};

/** Locale-less path of a tool's page. */
export function labToolHref(id: LabToolId): string {
  return `/student/ai-lab/${id}`;
}

/** The tools a learner can open, and the ones that are only announced; registry order kept. */
export function groupLabTools(tools: readonly LabTool[] = LAB_TOOLS): {
  available: LabTool[];
  comingSoon: LabTool[];
} {
  return {
    available: tools.filter((tool) => tool.status !== 'coming_soon'),
    comingSoon: tools.filter((tool) => tool.status === 'coming_soon'),
  };
}

const MOCK_TOOL_IDS = new Set<string>(Object.keys(MOCK_TOOL_OPTIONS));

/** A demo tool: its status is `mock` and its choices are listed in MOCK_TOOL_OPTIONS. */
export function isMockToolId(id: LabToolId): id is MockLabToolId {
  const tool = LAB_TOOLS.find((candidate) => candidate.id === id);
  return tool?.status === 'mock' && MOCK_TOOL_IDS.has(id);
}

/**
 * The `aiLab` key to render for a canned result: the tool's own demo text or `comingSoon`.
 * Anything else reads as `unavailable`, so an unexpected key is never rendered.
 */
export function mockMessageKey(toolId: LabToolId, messageKey: string): string {
  return messageKey === `tools.${toolId}.mockResult` || messageKey === 'comingSoon'
    ? messageKey
    : 'unavailable';
}

export type LabResult = { kind: 'text'; text: string } | { kind: 'mock'; messageKey: string };

export interface LabRun {
  id: number;
  prompt: string;
  /** The demo tool's choice, as its option value; null for the text tool. */
  option: string | null;
  result: LabResult;
}

/** Newest first, at most KEPT_RUNS. */
export function keepRecent(runs: readonly LabRun[], run: LabRun): LabRun[] {
  return [run, ...runs].slice(0, KEPT_RUNS);
}

export type LabFailure =
  | { kind: 'field'; key: string }
  | { kind: 'limit' }
  | { kind: 'disabled' }
  | { kind: 'toast' };

/**
 * How a failed run is shown (SPEC-I 4.6): a prompt problem under the field; the day's limit
 * or a budget, and AI switched off, as lasting alerts; everything else as a toast.
 */
export function labFailureOf(error: ActionError): LabFailure {
  switch (error.code) {
    case 'validation': {
      const key = error.fieldErrors?.prompt?.[0];
      return key === undefined ? { kind: 'toast' } : { kind: 'field', key };
    }
    case 'rate_limited':
      return error.retryAfterSeconds !== undefined &&
        error.retryAfterSeconds <= TRANSIENT_RETRY_SECONDS
        ? { kind: 'toast' }
        : { kind: 'limit' };
    case 'forbidden':
      return { kind: 'disabled' };
    default:
      return { kind: 'toast' };
  }
}
