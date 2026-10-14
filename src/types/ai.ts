import type { Locale } from './common';

export const TUTOR_MODES = [
  'explain',
  'hint',
  'quiz_me',
  'give_example',
  'challenge_me',
  'check_my_work',
] as const;
export type TutorMode = (typeof TUTOR_MODES)[number];

export interface TutorTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** Request body of `POST /api/ai/tutor`. */
export interface TutorRequest {
  mode: TutorMode;
  courseId: string | null;
  lessonId: string | null;
  /** 1–10 entries, strictly alternating user/assistant, the last one 'user'. */
  messages: TutorTurn[];
  locale: Locale;
}

/** One JSON object per line of the tutor response body. */
export type TutorStreamEvent =
  | { type: 'text'; text: string }
  /** Discard everything shown for this reply and show `tutor.<messageKey>` instead. */
  | { type: 'replace'; messageKey: string }
  | { type: 'done'; remainingToday: number; cutShort: boolean };

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Declared here rather than in src/lib/ai/lab-tools.ts (which re-exports both), because the
// block and lab schemas validate against the list and schemas may not import src/lib/ai.
export const LAB_TOOL_IDS = [
  'text',
  'image',
  'video',
  'voice',
  'vision',
  'chatbot-builder',
  // eslint-disable-next-line no-restricted-syntax -- a lab tool id, not a Tailwind class
  'ml-lab',
  'agent-builder',
] as const;
export type LabToolId = (typeof LAB_TOOL_IDS)[number];
