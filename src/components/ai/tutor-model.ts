import { getLabTool, isLabToolId } from '@/lib/ai/lab-tools';
import { AI_LIMITS } from '@/lib/limits';
import { ACTION_ERROR_CODES, type ActionErrorCode } from '@/types/actions';
import type { ChatMessage, TutorMode, TutorStreamEvent, TutorTurn } from '@/types/ai';

// The tutor conversation as pure state transitions (ARCHITECTURE.md 7.4, 8.3): no React, no
// server code. The hook, the panel and the tests share it.

export const TUTOR_ENDPOINT = '/api/ai/tutor';

/** Same values as TUTOR_REPLACE_KEYS of the server-only lib/ai/tutor; a unit test keeps them equal. */
export const TUTOR_REPLACE_KEY_LIST = ['cannotHelp', 'unavailable'] as const;
export type TutorReplaceKey = (typeof TUTOR_REPLACE_KEY_LIST)[number];

/** A 429 that asks to wait at most this long is the per-minute limit; anything longer is the day's limit or a budget. */
export const COOLDOWN_MAX_SECONDS = 60;

const LIMITS = AI_LIMITS.tutorRequest;

export type TutorBlock =
  | { kind: 'limit' }
  | { kind: 'cooldown'; seconds: number }
  | { kind: 'forbidden' }
  | { kind: 'unauthenticated' };

/** The turn in flight. */
export interface TutorReply {
  userId: string;
  text: string;
  replaced: TutorReplaceKey | null;
}

export interface TutorChatState {
  /** Finished messages, shown by AIChatPanel. */
  messages: ChatMessage[];
  /** Message id → the text sent back as history; no entry = never sent back. */
  history: Record<string, string>;
  mode: TutorMode;
  reply: TutorReply | null;
  /** From the last `done`; null until the first reply. */
  remainingToday: number | null;
  block: TutorBlock | null;
  /** Id counter: user ids `u<seq>`, reply ids `a<seq>`. */
  seq: number;
}

export function initialTutorState(mode: TutorMode): TutorChatState {
  return {
    messages: [],
    history: {},
    mode,
    reply: null,
    remainingToday: null,
    block: null,
    seq: 0,
  };
}

const replyIdOf = (userId: string): string => `a${userId.slice(1)}`;

export function startTurn(state: TutorChatState, text: string): TutorChatState {
  const seq = state.seq + 1;
  const userId = `u${seq}`;
  return {
    ...state,
    seq,
    messages: [...state.messages, { id: userId, role: 'user', content: text }],
    reply: { userId, text: '', replaced: null },
  };
}

/** Text after a `replace` is dropped. */
export function appendReplyText(state: TutorChatState, text: string): TutorChatState {
  const { reply } = state;
  if (reply === null || reply.replaced !== null) return state;
  return { ...state, reply: { ...reply, text: reply.text + text } };
}

/** Drops what was shown of the reply: the whole reply becomes `tutor.<key>`. */
export function replaceReply(state: TutorChatState, key: TutorReplaceKey): TutorChatState {
  const { reply } = state;
  if (reply === null) return state;
  return { ...state, reply: { ...reply, text: '', replaced: key } };
}

/**
 * Appends the reply as shown (`content`, translated by the caller). Only a reply that was
 * neither replaced nor empty is kept for the history, raw (without the cut-short note): a
 * refused, blocked or failed turn is never sent back, which also keeps the alternation.
 */
export function finishTurn(
  state: TutorChatState,
  args: { content: string; remainingToday: number | null },
): TutorChatState {
  const { reply } = state;
  if (reply === null) return state;
  const replyId = replyIdOf(reply.userId);
  const question = state.messages.find((message) => message.id === reply.userId);
  const keep = reply.replaced === null && reply.text.trim() !== '' && question !== undefined;
  return {
    ...state,
    messages: [...state.messages, { id: replyId, role: 'assistant', content: args.content }],
    history: keep
      ? { ...state.history, [reply.userId]: question.content, [replyId]: reply.text }
      : state.history,
    reply: null,
    remainingToday: args.remainingToday ?? state.remainingToday,
    block: args.remainingToday === 0 ? { kind: 'limit' } : state.block,
  };
}

/** The request failed before any stream: the question is taken back for the composer. */
export function abandonTurn(state: TutorChatState): { state: TutorChatState; text: string } {
  const { reply } = state;
  if (reply === null) return { state, text: '' };
  const question = state.messages.find((message) => message.id === reply.userId);
  return {
    state: {
      ...state,
      messages: state.messages.filter((message) => message.id !== reply.userId),
      reply: null,
    },
    text: question?.content ?? '',
  };
}

export function setBlock(state: TutorChatState, block: TutorBlock | null): TutorChatState {
  return { ...state, block };
}

/** A new conversation keeps the mode, the counter and any block (a limit outlives it). */
export function resetThread(state: TutorChatState): TutorChatState {
  return { ...state, messages: [], history: {}, reply: null };
}

/** null while nothing is shown yet, so AIChatMessages shows "thinking". */
export function streamingTextOf(state: TutorChatState): string | null {
  const { reply } = state;
  return reply !== null && reply.replaced === null && reply.text !== '' ? reply.text : null;
}

/**
 * The history for a new question: the turns that may be sent back, alternating, ending with
 * the question, within every bound of tutorRequestSchema (newest turns kept first).
 */
export function buildHistory(state: TutorChatState, text: string): TutorTurn[] {
  const turns: TutorTurn[] = [];
  for (const message of state.messages) {
    if (!Object.hasOwn(state.history, message.id)) continue;
    if (turns.at(-1)?.role === message.role) continue;
    const content = state.history[message.id] ?? '';
    const max = message.role === 'user' ? LIMITS.userMessageChars : LIMITS.assistantMessageChars;
    turns.push({ role: message.role, content: content.slice(0, max) });
  }
  while (turns.at(-1)?.role === 'user') turns.pop();
  turns.push({ role: 'user', content: text.slice(0, LIMITS.userMessageChars) });

  let kept = turns.slice(-LIMITS.maxMessages);
  const total = (list: TutorTurn[]) => list.reduce((sum, turn) => sum + turn.content.length, 0);
  while (kept.length > 1 && (total(kept) > LIMITS.totalChars || kept[0]?.role !== 'user')) {
    kept = kept.slice(1);
  }
  return kept;
}

// --- Wire format --------------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** One NDJSON line of the tutor route; null for anything that is not exactly an event. */
export function parseTutorEvent(line: string): TutorStreamEvent | null {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    return null;
  }
  if (!isRecord(value)) return null;
  if (value.type === 'text') {
    return typeof value.text === 'string' ? { type: 'text', text: value.text } : null;
  }
  if (value.type === 'replace') {
    return typeof value.messageKey === 'string'
      ? { type: 'replace', messageKey: value.messageKey }
      : null;
  }
  if (value.type === 'done') {
    const { remainingToday, cutShort } = value;
    return typeof remainingToday === 'number' &&
      Number.isFinite(remainingToday) &&
      remainingToday >= 0 &&
      typeof cutShort === 'boolean'
      ? { type: 'done', remainingToday, cutShort }
      : null;
  }
  return null;
}

function eventOfLine(line: string): TutorStreamEvent | null {
  if (line.trim() === '') return null;
  const event = parseTutorEvent(line);
  if (event === null) throw new Error('malformed tutor stream');
  return event;
}

/** The events of a response body. Throws on a malformed line or a broken stream. */
export async function* readTutorEvents(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<TutorStreamEvent, void, void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let end = buffer.indexOf('\n');
      while (end !== -1) {
        const event = eventOfLine(buffer.slice(0, end));
        buffer = buffer.slice(end + 1);
        if (event !== null) yield event;
        end = buffer.indexOf('\n');
      }
    }
    const last = eventOfLine(buffer + decoder.decode());
    if (last !== null) yield last;
  } finally {
    // Stops the download when the reader is left early; a no-op after the end.
    await reader.cancel().catch(() => undefined);
  }
}

export function toReplaceKey(messageKey: string): TutorReplaceKey {
  return (TUTOR_REPLACE_KEY_LIST as readonly string[]).includes(messageKey)
    ? (messageKey as TutorReplaceKey)
    : 'unavailable';
}

export interface TutorFailure {
  code: ActionErrorCode;
  retryAfterSeconds: number | null;
}

const STATUS_CODES: Record<number, ActionErrorCode> = {
  400: 'validation',
  401: 'unauthenticated',
  403: 'forbidden',
  429: 'rate_limited',
};

/** The code of a failed request: the JSON body's when it names a known one, else the status's. */
export function failureOf(status: number, body: unknown): TutorFailure {
  const error = isRecord(body) && isRecord(body.error) ? body.error : null;
  const code = error?.code;
  if (typeof code === 'string' && (ACTION_ERROR_CODES as readonly string[]).includes(code)) {
    const delay = error?.retryAfterSeconds;
    return {
      code: code as ActionErrorCode,
      retryAfterSeconds:
        typeof delay === 'number' && Number.isFinite(delay) && delay >= 0 ? delay : null,
    };
  }
  return {
    code: Object.hasOwn(STATUS_CODES, status) ? (STATUS_CODES[status] ?? 'internal') : 'internal',
    retryAfterSeconds: null,
  };
}

/** A lasting state for the composer, or null for a transient failure (a toast). */
export function blockFor(failure: TutorFailure): TutorBlock | null {
  switch (failure.code) {
    case 'unauthenticated':
      return { kind: 'unauthenticated' };
    case 'forbidden':
      return { kind: 'forbidden' };
    case 'rate_limited':
      return failure.retryAfterSeconds !== null && failure.retryAfterSeconds <= COOLDOWN_MAX_SECONDS
        ? { kind: 'cooldown', seconds: Math.max(1, Math.ceil(failure.retryAfterSeconds)) }
        : { kind: 'limit' };
    default:
      return null;
  }
}

/**
 * The AI Lab link of an activity block: only for a tool that can be opened, and only in the
 * student area (the same block renders in the teacher player, and the lab is student-only).
 */
export function activityLabHref(labToolId: string | null, pathname: string): string | null {
  if (labToolId === null || !isLabToolId(labToolId)) return null;
  if (getLabTool(labToolId).status === 'coming_soon') return null;
  if (!pathname.startsWith('/student/')) return null;
  return `/student/ai-lab/${labToolId}`;
}
