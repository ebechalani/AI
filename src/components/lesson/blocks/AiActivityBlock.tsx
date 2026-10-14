import type { ComponentType } from 'react';
import type { BlockRendererProps } from './registry';

// Stub (F8): WS-I fills it in (ARCHITECTURE.md 7.6).
export const AiActivityBlock: ComponentType<BlockRendererProps<'ai_activity'>> =
  function AiActivityBlock() {
    return null;
  };
