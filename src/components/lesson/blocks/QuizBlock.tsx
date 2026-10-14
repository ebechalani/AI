import type { ComponentType } from 'react';
import type { BlockRendererProps } from './registry';

// Stub (F8): WS-C fills it in (ARCHITECTURE.md 7.6).
export const QuizBlock: ComponentType<BlockRendererProps<'quiz'>> = function QuizBlock() {
  return null;
};
