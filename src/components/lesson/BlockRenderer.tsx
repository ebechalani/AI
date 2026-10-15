import type { ComponentType } from 'react';
import { BLOCK_RENDERERS, type BlockRendererProps } from './blocks/registry';

// Types already reported, so a lesson full of one unknown block logs it once per server process.
const reported = new Set<string>();

/**
 * One block of the lesson through the registry (ARCHITECTURE.md 7.6). A type the registry does
 * not know (content newer than this code) renders nothing and is logged once.
 */
export function BlockRenderer({ block, runtime }: BlockRendererProps) {
  const Renderer = Object.hasOwn(BLOCK_RENDERERS, block.type)
    ? (BLOCK_RENDERERS[block.type] as ComponentType<BlockRendererProps> | undefined)
    : undefined;
  if (Renderer === undefined) {
    if (!reported.has(block.type)) {
      reported.add(block.type);
      console.error(`[lesson] no renderer for block type "${block.type}" (block ${block.id})`);
    }
    return null;
  }
  return <Renderer block={block} runtime={runtime} />;
}
