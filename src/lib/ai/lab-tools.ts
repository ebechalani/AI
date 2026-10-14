// Shared: no 'server-only', the AI Lab pages render this registry. Names and descriptions come
// from the `aiLab` message namespace (aiLab.tools.<id>.title | description).

import { LAB_TOOL_IDS, type LabToolId } from '@/types/ai';

export { LAB_TOOL_IDS, type LabToolId };

export type LabToolStatus = 'live' | 'mock' | 'coming_soon';

export interface LabTool {
  id: LabToolId;
  /** The name of a lucide-react icon component. */
  icon: string;
  /** live: answered by the AI provider. mock: real interface, canned result. coming_soon: a card only. */
  status: LabToolStatus;
}

export const LAB_TOOLS: LabTool[] = [
  { id: 'text', icon: 'PenLine', status: 'live' },
  { id: 'image', icon: 'Image', status: 'mock' },
  { id: 'video', icon: 'Video', status: 'mock' },
  { id: 'voice', icon: 'Mic', status: 'mock' },
  { id: 'vision', icon: 'ScanEye', status: 'mock' },
  { id: 'chatbot-builder', icon: 'Bot', status: 'mock' },
  // eslint-disable-next-line no-restricted-syntax -- a lab tool id, not a Tailwind class
  { id: 'ml-lab', icon: 'BrainCircuit', status: 'coming_soon' },
  { id: 'agent-builder', icon: 'Workflow', status: 'coming_soon' },
];

export function getLabTool(id: LabToolId): LabTool {
  const tool = LAB_TOOLS.find((candidate) => candidate.id === id);
  if (!tool) throw new Error(`Unknown lab tool: ${id}`);
  return tool;
}
