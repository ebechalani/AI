import type { ComponentType } from 'react';
import type { BlockRendererProps } from './registry';

// Stub (F8): WS-B fills it in (ARCHITECTURE.md 7.6).
export const ReflectionBlock: ComponentType<BlockRendererProps<'reflection'>> =
  function ReflectionBlock() {
    return null;
  };
