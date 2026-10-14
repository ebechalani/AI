import 'server-only';
import { AI_LIMITS, CONTENT_LIMITS } from '@/lib/limits';
import type { TutorStreamEvent, TutorTurn } from '@/types/ai';
import type { AgeBand } from '@/types/common';
import { getAiProvider } from './index';
import {
  buildTutorSystemPrompt,
  TUTOR_BLOCK_INTROS,
  TUTOR_BLOCKS,
  TUTOR_CLOSING_LINE,
  TUTOR_NO_REFERENCE,
  TUTOR_NO_TRANSCRIPT,
  TUTOR_REFERENCE_LABELS,
  TUTOR_TRANSCRIPT_LABELS,
} from './prompts/tutor';
import { checkOutput, fitOutput, outputCharLimit, sanitizeUserText, wrapUntrusted } from './safety';
import {
  NO_USAGE,
  type AiStopReason,
  type AiStreamEvent,
  type AiTextRequest,
  type AiUsage,
  type TutorContext,
} from './types';

const LIMITS = AI_LIMITS.tutorRequest;

// --- Request ------------------------------------------------------------------------------------

const oneLine = (text: string): string => text.replace(/\s+/g, ' ').trim();

// Sanitize before cutting: cutting first could leave half an address that no longer matches.
const clean = (text: string, maxChars: number): string =>
  sanitizeUserText(text).slice(0, maxChars).trim();

function referenceText(context: TutorContext): string {
  const { reference } = context;
  const lines: string[] = [];
  const add = (label: string, value: string | null, maxChars: number): void => {
    const text = value === null ? '' : oneLine(clean(value, maxChars));
    if (text !== '') lines.push(`${label}: ${text}`);
  };
  add(TUTOR_REFERENCE_LABELS.pathway, reference.pathwayTitle, CONTENT_LIMITS.titleChars);
  add(TUTOR_REFERENCE_LABELS.course, reference.courseTitle, CONTENT_LIMITS.titleChars);
  add(TUTOR_REFERENCE_LABELS.lesson, reference.lessonTitle, CONTENT_LIMITS.titleChars);
  add(TUTOR_REFERENCE_LABELS.summary, reference.lessonSummary, CONTENT_LIMITS.summaryChars);

  const excerpt =
    reference.lessonExcerpt === null
      ? ''
      : clean(reference.lessonExcerpt, CONTENT_LIMITS.tutorExcerptChars);
  if (excerpt !== '') lines.push(`${TUTOR_REFERENCE_LABELS.excerpt}:\n${excerpt}`);

  const results = context.recentQuizResults
    .slice(0, AI_LIMITS.tutorRecentQuizResults)
    .filter((result) => Number.isFinite(result.scorePercent))
    .map((result) => {
      const title = oneLine(clean(result.quizTitle, CONTENT_LIMITS.titleChars));
      const score = Math.max(0, Math.min(100, Math.round(result.scorePercent)));
      return `- ${title}: ${score}% (${result.passed ? 'passed' : 'not passed'})`;
    });
  if (results.length > 0) {
    lines.push(`${TUTOR_REFERENCE_LABELS.quizResults}:\n${results.join('\n')}`);
  }

  return lines.length > 0 ? lines.join('\n') : TUTOR_NO_REFERENCE;
}

// The route has validated these bounds already (tutorRequestSchema). They are applied again
// here, newest turn first, so no caller can send more than the contract allows.
function boundHistory(messages: TutorTurn[]): TutorTurn[] {
  const kept: TutorTurn[] = [];
  let totalChars = 0;
  for (const turn of messages.slice(-LIMITS.maxMessages).toReversed()) {
    const maxChars = turn.role === 'user' ? LIMITS.userMessageChars : LIMITS.assistantMessageChars;
    const content = clean(turn.content, maxChars);
    totalChars += content.length;
    if (kept.length > 0 && totalChars > LIMITS.totalChars) break;
    kept.unshift({ role: turn.role, content });
  }
  return kept;
}

/**
 * The provider request for one tutor reply (ARCHITECTURE.md 8.3). The system prompt is the
 * policy alone. Everything a learner, a client or a course author wrote goes into one user
 * message as delimited data: earlier turns are a labelled transcript, never real
 * assistant-role messages, because the client supplies them and could forge them.
 */
export function buildTutorRequest(
  context: TutorContext,
  messages: TutorTurn[],
  signal?: AbortSignal,
): AiTextRequest {
  const history = boundHistory(messages);
  const question = history.at(-1);
  // Content that is empty once sanitized (invisible characters only) is not refused here: it
  // passed tutorRequestSchema, and the block then reads "(empty)".
  if (question === undefined || question.role !== 'user') {
    throw new Error('A tutor request must end with a learner message.');
  }
  const earlier = history.slice(0, -1);
  const transcript =
    earlier.length === 0
      ? TUTOR_NO_TRANSCRIPT
      : earlier
          .map((turn) => `${TUTOR_TRANSCRIPT_LABELS[turn.role]}: ${turn.content}`)
          .join('\n\n');

  const content = [
    TUTOR_BLOCK_INTROS.reference,
    wrapUntrusted(TUTOR_BLOCKS.reference, referenceText(context)),
    '',
    TUTOR_BLOCK_INTROS.transcript,
    wrapUntrusted(TUTOR_BLOCKS.transcript, transcript),
    '',
    TUTOR_BLOCK_INTROS.question,
    wrapUntrusted(TUTOR_BLOCKS.question, question.content),
    '',
    TUTOR_CLOSING_LINE,
  ].join('\n');

  return {
    purpose: 'tutor',
    system: buildTutorSystemPrompt({
      mode: context.mode,
      ageBand: context.ageBand,
      locale: context.locale,
      hasGradedWork: context.hasGradedWork,
    }),
    messages: [{ role: 'user', content }],
    maxOutputTokens: AI_LIMITS.maxOutputTokens.tutor,
    ...(signal ? { signal } : {}),
  };
}

/**
 * The provider's raw stream for one tutor reply. Nothing from it may reach the learner
 * directly: pass it through guardTutorStream(), which releases text only after checkOutput.
 *
 * Nothing runs until the stream is read, so a bad AI configuration or a failing provider
 * surfaces while iterating, where guardTutorStream() turns it into a neutral message.
 */
export async function* streamTutorReply(
  context: TutorContext,
  messages: TutorTurn[],
  options: { signal?: AbortSignal } = {},
): AsyncGenerator<AiStreamEvent, void, void> {
  yield* getAiProvider().streamText(buildTutorRequest(context, messages, options.signal));
}

// --- Release after checking ---------------------------------------------------------------------

/** Keys of the `tutor` message namespace that a `replace` event may name. */
export const TUTOR_REPLACE_KEYS = {
  /** The neutral "I can't help with that here": a failed output check or a provider refusal. */
  cannotHelp: 'cannotHelp',
  /** The provider failed or returned nothing. */
  unavailable: 'unavailable',
} as const;

export type TutorReplyOutcome =
  | 'ok'
  /** The text shown is incomplete: provider cap, length limit, or a failure after text was shown. */
  | 'cut_short'
  /** checkOutput refused the reply: the caller increments `blockedCount`. */
  | 'blocked'
  | 'refused'
  | 'error';

export type GuardedTutorEvent =
  | { type: 'text'; text: string }
  | { type: 'replace'; messageKey: string }
  | {
      type: 'done';
      outcome: TutorReplyOutcome;
      /** What to record with recordAiTokens; zero when the provider failed before reporting. */
      usage: AiUsage;
      stopReason: AiStopReason;
      model: string;
      /** What the provider threw, for the server log; null otherwise. */
      error: unknown;
    };

// Children of these ages never see text that a later check takes back.
const WHOLE_REPLY_AGE_BANDS: readonly AgeBand[] = ['8-10', '11-12'];
const PARAGRAPH_BREAK = '\n\n';

/**
 * Buffers a provider stream and releases text only after checkOutput has passed on everything
 * released so far plus the new part: per completed paragraph, or the whole reply at once for
 * the youngest age bands. The provider stream is always read to its end so the usage is
 * known, and the last event is always `done`; this generator does not throw.
 */
export async function* guardTutorStream(
  source: AsyncIterable<AiStreamEvent>,
  ageBand: AgeBand,
): AsyncGenerator<GuardedTutorEvent, void, void> {
  const byParagraph = !WHOLE_REPLY_AGE_BANDS.includes(ageBand);
  // `outcome` is set as soon as the fate of the reply is known; text that arrives later is dropped.
  const state = { released: '', pending: '', outcome: null as TutorReplyOutcome | null };

  const release = (part: string): GuardedTutorEvent | null => {
    const check = checkOutput(state.released + part, 'tutor');
    if (check.ok) {
      state.released += part;
      state.pending = state.pending.slice(part.length);
      return part === '' ? null : { type: 'text', text: part };
    }
    state.pending = '';
    if (check.reason === 'banned_pattern') {
      state.outcome = 'blocked';
      return { type: 'replace', messageKey: TUTOR_REPLACE_KEYS.cannotHelp };
    }
    state.outcome = 'cut_short';
    const tail = fitOutput(state.released + part, 'tutor').slice(state.released.length);
    state.released += tail;
    return tail === '' ? null : { type: 'text', text: tail };
  };

  // release() assigns state.outcome. Reading it through a function keeps the compiler from
  // assuming that it is unchanged across those calls.
  const decided = (): TutorReplyOutcome | null => state.outcome;

  let final: { usage: AiUsage; stopReason: AiStopReason; model: string } = {
    usage: NO_USAGE,
    stopReason: 'error',
    model: 'unknown',
  };
  let error: unknown = null;

  try {
    for await (const event of source) {
      if (event.type === 'done') {
        final = { usage: event.usage, stopReason: event.stopReason, model: event.model };
        continue;
      }
      if (decided() !== null) continue;
      state.pending += event.text;

      let part: string | null = null;
      if (state.released.length + state.pending.length > outputCharLimit('tutor')) {
        // Past the length limit: release what fits now instead of buffering without bound.
        part = state.pending;
      } else if (byParagraph) {
        const end = state.pending.lastIndexOf(PARAGRAPH_BREAK);
        if (end !== -1) part = state.pending.slice(0, end + PARAGRAPH_BREAK.length);
      }
      if (part !== null) {
        const released = release(part);
        if (released !== null) yield released;
      }
    }
  } catch (caught) {
    error = caught ?? new Error('The provider stream failed.');
    final = { ...final, stopReason: 'error' };
  }

  if (decided() === null && final.stopReason === 'refusal') {
    state.outcome = 'refused';
    yield { type: 'replace', messageKey: TUTOR_REPLACE_KEYS.cannotHelp };
  }
  // A reply of nothing but white space is not released: it is handled as an empty reply below.
  const blank = (state.released + state.pending).trim() === '';
  if (decided() === null && final.stopReason !== 'error' && !blank) {
    const released = release(state.pending);
    if (released !== null) yield released;
  }
  // Still undecided: the reply ended cleanly, or it failed and its unfinished paragraph is dropped.
  if (decided() === null) {
    if (state.released.trim() === '') {
      state.outcome = 'error';
      yield { type: 'replace', messageKey: TUTOR_REPLACE_KEYS.unavailable };
    } else {
      state.outcome = final.stopReason === 'end' ? 'ok' : 'cut_short';
    }
  }

  yield { type: 'done', outcome: decided() ?? 'error', ...final, error };
}

// --- NDJSON framing -----------------------------------------------------------------------------

export const TUTOR_STREAM_CONTENT_TYPE = 'application/x-ndjson; charset=utf-8';

/** The wire event for a guarded event; `remainingToday` comes from checkAndCountAiUsage. */
export function toTutorStreamEvent(
  event: GuardedTutorEvent,
  remainingToday: number,
): TutorStreamEvent {
  if (event.type === 'text') return { type: 'text', text: event.text };
  if (event.type === 'replace') return { type: 'replace', messageKey: event.messageKey };
  return { type: 'done', remainingToday, cutShort: event.outcome === 'cut_short' };
}

/** One JSON object per line. JSON.stringify escapes line breaks inside strings. */
export function encodeTutorEvent(event: TutorStreamEvent): string {
  return `${JSON.stringify(event)}\n`;
}
