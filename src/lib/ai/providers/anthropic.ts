import 'server-only';
import { AiError, type AiProvider, type AiStreamEvent } from '../types';

export interface AnthropicProviderConfig {
  apiKey: string;
  /** ANTHROPIC_MODEL; the default is set in src/lib/env.ts. */
  model: string;
}

// Placeholder until workstream I writes the adapter of ARCHITECTURE.md 8.1 (official SDK,
// streaming helper, structured outputs validated again with zod, effort per purpose, provider
// cap with headroom, `refusal` mapped to stopReason 'refusal'). Every call fails loudly: a
// deployment that asks for the real provider must not serve mock answers as if they were real.
export function createAnthropicProvider(config: AnthropicProviderConfig): AiProvider {
  const notImplemented = (): AiError =>
    new AiError('provider_error', {
      message: `The Anthropic adapter (model ${config.model}) is not implemented yet. Unset AI_PROVIDER to use the mock provider.`,
    });

  return {
    id: 'anthropic',
    generateText: () => Promise.reject(notImplemented()),
    streamText: (): AsyncIterable<AiStreamEvent> => ({
      [Symbol.asyncIterator]: () => ({ next: () => Promise.reject(notImplemented()) }),
    }),
    generateObject: () => Promise.reject(notImplemented()),
  };
}
