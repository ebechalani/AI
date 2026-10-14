import type { ComponentType } from 'react';
import type { BlockRendererProps } from './registry';

// Stub (F8): WS-B fills it in (ARCHITECTURE.md 7.6).
export const CodeActivityBlock: ComponentType<BlockRendererProps<'code_activity'>> =
  function CodeActivityBlock() {
    return null;
  };
