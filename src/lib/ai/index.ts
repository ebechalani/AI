import 'server-only';
import { getAiEnv } from '@/lib/env';
import { createAnthropicProvider } from './providers/anthropic';
import { mockProvider } from './providers/mock';
import type { AiProvider } from './types';

let anthropic: { apiKey: string; model: string; provider: AiProvider } | null = null;
let warnedAboutMissingKey = false;

/**
 * The mock provider unless AI_PROVIDER=anthropic and ANTHROPIC_API_KEY are both set. It reads
 * getAiEnv() on every call, so it needs no Firebase variables and never runs at module load.
 */
export function getAiProvider(): AiProvider {
  const env = getAiEnv();
  if (env.provider !== 'anthropic') return mockProvider;

  if (env.anthropicApiKey === null) {
    if (!warnedAboutMissingKey) {
      warnedAboutMissingKey = true;
      console.warn(
        '[ai] AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set: using the mock provider.',
      );
    }
    return mockProvider;
  }

  if (anthropic?.apiKey !== env.anthropicApiKey || anthropic.model !== env.anthropicModel) {
    anthropic = {
      apiKey: env.anthropicApiKey,
      model: env.anthropicModel,
      provider: createAnthropicProvider({ apiKey: env.anthropicApiKey, model: env.anthropicModel }),
    };
  }
  return anthropic.provider;
}
