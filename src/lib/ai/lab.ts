import 'server-only';
import { AI_LIMITS } from '@/lib/limits';
import type { AgeBand, Locale } from '@/types/common';
import { getAiProvider } from './index';
import { getLabTool, type LabToolId } from './lab-tools';
import {
  buildLabSystemPrompt,
  LAB_BLOCK_INTRO,
  LAB_BLOCKS,
  LAB_CLOSING_LINE,
  LAB_NOTICES,
} from './prompts/lab';
import { checkOutput, fitOutput, sanitizeUserText, wrapUntrusted } from './safety';
import { AiError, NO_USAGE, type AiTextResult, type AiUsage } from './types';

export type LabToolResult = { kind: 'text'; text: string } | { kind: 'mock'; messageKey: string };

export type LabRunOutcome =
  | 'ok'
  | 'cut_short'
  /** checkOutput refused the text: the caller increments `blockedCount`. */
  | 'blocked'
  | 'refused'
  /** No provider call was made: a `mock` or `coming_soon` tool. */
  | 'canned';

export interface LabRunReport {
  result: LabToolResult;
  outcome: LabRunOutcome;
  /** What to record with recordAiTokens; zero when no provider call was made. */
  usage: AiUsage;
}

/** Message keys of the `aiLab` namespace that a `mock` result names. */
export const labMessageKeys = {
  mockResult: (toolId: LabToolId): string => `tools.${toolId}.mockResult`,
  comingSoon: 'comingSoon',
} as const;

/**
 * runLabTool plus what its caller has to account for: the tokens used and whether the output
 * check refused the text. Throws AiError when the provider call fails or returns nothing.
 */
export async function runLabToolWithReport(
  toolId: LabToolId,
  input: { prompt: string },
  ctx: { ageBand: AgeBand; locale: Locale },
): Promise<LabRunReport> {
  const tool = getLabTool(toolId);
  if (tool.status !== 'live') {
    const messageKey =
      tool.status === 'mock' ? labMessageKeys.mockResult(toolId) : labMessageKeys.comingSoon;
    return { result: { kind: 'mock', messageKey }, outcome: 'canned', usage: NO_USAGE };
  }

  const prompt = sanitizeUserText(input.prompt).slice(0, AI_LIMITS.labPromptChars);
  let reply: AiTextResult;
  try {
    reply = await getAiProvider().generateText({
      purpose: 'lab',
      system: buildLabSystemPrompt({ toolId, ageBand: ctx.ageBand, locale: ctx.locale }),
      messages: [
        {
          role: 'user',
          content: [
            LAB_BLOCK_INTRO,
            wrapUntrusted(LAB_BLOCKS.prompt, prompt),
            '',
            LAB_CLOSING_LINE,
          ].join('\n'),
        },
      ],
      maxOutputTokens: AI_LIMITS.maxOutputTokens.lab,
    });
  } catch (error) {
    if (error instanceof AiError) throw error;
    throw new AiError('provider_error', { cause: error });
  }

  const { usage } = reply;
  const notices = LAB_NOTICES[ctx.locale];
  const text = (value: string): LabToolResult => ({ kind: 'text', text: value });

  if (reply.stopReason === 'error') throw new AiError('provider_error', { usage });
  if (reply.stopReason === 'refusal') {
    return { result: text(notices.cannotHelp), outcome: 'refused', usage };
  }

  const check = checkOutput(reply.text, 'lab');
  if (!check.ok && check.reason === 'banned_pattern') {
    return { result: text(notices.cannotHelp), outcome: 'blocked', usage };
  }
  const shown = fitOutput(reply.text, 'lab').trim();
  if (shown === '') throw new AiError('invalid_output', { usage });
  if (!check.ok || reply.stopReason === 'max_tokens') {
    return { result: text(`${shown}\n\n${notices.cutShort}`), outcome: 'cut_short', usage };
  }
  return { result: text(shown), outcome: 'ok', usage };
}

/**
 * Runs one AI Lab tool. `text` goes through the provider and its output is checked as a whole
 * before it is returned; a refused or blocked reply comes back as a neutral text. The other
 * tools return the message key of their canned result.
 */
export async function runLabTool(
  toolId: LabToolId,
  input: { prompt: string },
  ctx: { ageBand: AgeBand; locale: Locale },
): Promise<LabToolResult> {
  return (await runLabToolWithReport(toolId, input, ctx)).result;
}
