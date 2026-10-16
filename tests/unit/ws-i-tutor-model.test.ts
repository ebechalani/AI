import { describe, expect, it } from 'vitest';
import {
  abandonTurn,
  activityLabHref,
  appendReplyText,
  blockFor,
  buildHistory,
  failureOf,
  finishTurn,
  initialTutorState,
  parseTutorEvent,
  readTutorEvents,
  replaceReply,
  resetThread,
  setBlock,
  startTurn,
  streamingTextOf,
  toReplaceKey,
  TUTOR_REPLACE_KEY_LIST,
  type TutorChatState,
} from '@/components/ai/tutor-model';
import { TUTOR_REPLACE_KEYS } from '@/lib/ai/tutor';
import { AI_LIMITS } from '@/lib/limits';
import { tutorRequestSchema } from '@/lib/schemas/ai';
import type { TutorStreamEvent } from '@/types/ai';

const LIMITS = AI_LIMITS.tutorRequest;

/** One finished exchange: the question and a reply that was neither replaced nor empty. */
function exchange(state: TutorChatState, question: string, reply: string): TutorChatState {
  const started = appendReplyText(startTurn(state, question), reply);
  return finishTurn(started, { content: reply, remainingToday: 50 });
}

function validRequest(messages: unknown) {
  return tutorRequestSchema.safeParse({
    mode: 'explain',
    courseId: null,
    lessonId: null,
    locale: 'en',
    messages,
  });
}

function streamOf(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  let index = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      const chunk = chunks[index];
      index += 1;
      if (chunk === undefined) controller.close();
      else controller.enqueue(chunk);
    },
  });
}

async function collect(body: ReadableStream<Uint8Array>): Promise<TutorStreamEvent[]> {
  const events: TutorStreamEvent[] = [];
  for await (const event of readTutorEvents(body)) events.push(event);
  return events;
}

/** A deterministic pseudo-random sequence, so the synthetic threads are the same every run. */
function sequence(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 1_103_515_245 + 12_345) % 2_147_483_648;
    return value / 2_147_483_648;
  };
}

describe('tutor-model constants', () => {
  it('names the same replace keys as the server pipeline', () => {
    expect([...TUTOR_REPLACE_KEY_LIST].sort()).toEqual(Object.values(TUTOR_REPLACE_KEYS).sort());
  });
});

describe('tutor-model transitions', () => {
  it('starts, streams and finishes a turn, keeping the raw reply as history', () => {
    let state = startTurn(initialTutorState('hint'), 'What is AI?');
    expect(state.messages).toEqual([{ id: 'u1', role: 'user', content: 'What is AI?' }]);
    expect(streamingTextOf(state)).toBeNull();
    state = appendReplyText(state, 'AI is ');
    state = appendReplyText(state, 'a field.');
    expect(streamingTextOf(state)).toBe('AI is a field.');
    state = finishTurn(state, { content: 'AI is a field.\n\n*(cut)*', remainingToday: 12 });
    expect(state.reply).toBeNull();
    expect(state.messages.at(-1)).toEqual({
      id: 'a1',
      role: 'assistant',
      content: 'AI is a field.\n\n*(cut)*',
    });
    expect(state.history).toEqual({ u1: 'What is AI?', a1: 'AI is a field.' });
    expect(state.remainingToday).toBe(12);
    expect(state.block).toBeNull();
    expect(state.mode).toBe('hint');
  });

  it('drops the partial text on replace, ignores later text and never sends the turn back', () => {
    let state = appendReplyText(startTurn(initialTutorState('explain'), 'Hi'), 'Partial');
    state = replaceReply(state, 'cannotHelp');
    expect(streamingTextOf(state)).toBeNull();
    state = appendReplyText(state, ' more');
    expect(state.reply).toEqual({ userId: 'u1', text: '', replaced: 'cannotHelp' });
    state = finishTurn(state, { content: 'I can’t help', remainingToday: 3 });
    expect(state.history).toEqual({});
    expect(state.messages).toHaveLength(2);
  });

  it('does not keep an empty reply for the history', () => {
    const state = finishTurn(startTurn(initialTutorState('explain'), 'Hi'), {
      content: 'unavailable',
      remainingToday: null,
    });
    expect(state.history).toEqual({});
    expect(state.remainingToday).toBeNull();
  });

  it('blocks the composer when no message is left today', () => {
    const state = exchange(initialTutorState('explain'), 'Hi', 'Hello');
    const last = finishTurn(appendReplyText(startTurn(state, 'Again'), 'Ok'), {
      content: 'Ok',
      remainingToday: 0,
    });
    expect(last.block).toEqual({ kind: 'limit' });
    expect(last.remainingToday).toBe(0);
  });

  it('abandons a turn and hands its question back', () => {
    const before = exchange(initialTutorState('explain'), 'One', 'Reply');
    const { state, text } = abandonTurn(startTurn(before, 'Two'));
    expect(text).toBe('Two');
    expect(state.messages).toEqual(before.messages);
    expect(state.reply).toBeNull();
    expect(abandonTurn(before)).toEqual({ state: before, text: '' });
  });

  it('starts a new conversation that keeps the mode, the counter and any block', () => {
    let state = exchange(initialTutorState('quiz_me'), 'One', 'Reply');
    state = setBlock(state, { kind: 'cooldown', seconds: 20 });
    const reset = resetThread(state);
    expect(reset.messages).toEqual([]);
    expect(reset.history).toEqual({});
    expect(reset.reply).toBeNull();
    expect(reset.mode).toBe('quiz_me');
    expect(reset.remainingToday).toBe(50);
    expect(reset.block).toEqual({ kind: 'cooldown', seconds: 20 });
  });
});

describe('buildHistory', () => {
  it('alternates, ends with the new question and skips turns that are never sent back', () => {
    let state = exchange(initialTutorState('explain'), 'Q1', 'A1');
    state = finishTurn(replaceReply(startTurn(state, 'Q2'), 'cannotHelp'), {
      content: 'refused',
      remainingToday: 40,
    });
    state = exchange(state, 'Q3', 'A3');
    expect(buildHistory(state, 'Q4')).toEqual([
      { role: 'user', content: 'Q1' },
      { role: 'assistant', content: 'A1' },
      { role: 'user', content: 'Q3' },
      { role: 'assistant', content: 'A3' },
      { role: 'user', content: 'Q4' },
    ]);
  });

  it('cuts a long assistant text and a long question to their limits', () => {
    const state = exchange(initialTutorState('explain'), 'Q', 'x'.repeat(5_000));
    const history = buildHistory(state, 'y'.repeat(2_500));
    expect(history[1]?.content).toHaveLength(LIMITS.assistantMessageChars);
    expect(history.at(-1)?.content).toHaveLength(LIMITS.userMessageChars);
  });

  it('keeps at most ten turns, starting with the learner', () => {
    let state = initialTutorState('explain');
    for (let index = 0; index < 8; index += 1) state = exchange(state, `Q${index}`, `A${index}`);
    const history = buildHistory(state, 'last');
    expect(history.length).toBeLessThanOrEqual(LIMITS.maxMessages);
    expect(history[0]?.role).toBe('user');
    expect(history.at(-1)).toEqual({ role: 'user', content: 'last' });
  });

  it('respects the total size', () => {
    let state = initialTutorState('explain');
    for (let index = 0; index < 4; index += 1) {
      state = exchange(state, 'q'.repeat(2_000), 'a'.repeat(4_000));
    }
    const history = buildHistory(state, 'z'.repeat(2_000));
    const total = history.reduce((sum, turn) => sum + turn.content.length, 0);
    expect(total).toBeLessThanOrEqual(LIMITS.totalChars);
    expect(history[0]?.role).toBe('user');
    expect(validRequest(history).success).toBe(true);
  });

  it('always builds a request the route accepts, for threads of 1 to 30 turns', () => {
    const random = sequence(7);
    const text = (max: number) => 'w'.repeat(1 + Math.floor(random() * max));
    for (let turns = 1; turns <= 30; turns += 1) {
      let state = initialTutorState('explain');
      for (let index = 0; index < turns; index += 1) {
        const kind = random();
        if (kind < 0.15) {
          state = finishTurn(replaceReply(startTurn(state, text(2_000)), 'unavailable'), {
            content: 'x',
            remainingToday: 5,
          });
        } else {
          state = exchange(state, text(2_000), text(6_000));
        }
      }
      const result = validRequest(buildHistory(state, text(2_000)));
      expect(result.success, `thread of ${turns} turns`).toBe(true);
    }
  });
});

describe('the wire format', () => {
  it('parses exactly the three event shapes', () => {
    expect(parseTutorEvent('{"type":"text","text":"Hi"}')).toEqual({ type: 'text', text: 'Hi' });
    expect(parseTutorEvent('{"type":"replace","messageKey":"cannotHelp"}')).toEqual({
      type: 'replace',
      messageKey: 'cannotHelp',
    });
    expect(parseTutorEvent('{"type":"done","remainingToday":3,"cutShort":false}')).toEqual({
      type: 'done',
      remainingToday: 3,
      cutShort: false,
    });
    for (const line of [
      '{"type":"done","remainingToday":-1,"cutShort":false}',
      '{"type":"done","remainingToday":2,"cutShort":"no"}',
      '{"type":"done","cutShort":true}',
      '{"type":"text","text":5}',
      '{"type":"replace"}',
      '{"type":"other"}',
      '[]',
      'null',
      'not json',
    ]) {
      expect(parseTutorEvent(line), line).toBeNull();
    }
  });

  it('reads lines split across chunks, multi-byte characters included', async () => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(
      '{"type":"text","text":"Café’s"}\n\n{"type":"done","remainingToday":4,"cutShort":true}',
    );
    // Split inside the JSON, inside "é" (2 bytes) and inside "’" (3 bytes).
    const e = bytes.indexOf(0xc3);
    const quote = bytes.indexOf(0xe2);
    const chunks = [
      bytes.slice(0, 10),
      bytes.slice(10, e + 1),
      bytes.slice(e + 1, quote + 1),
      bytes.slice(quote + 1, quote + 2),
      bytes.slice(quote + 2),
    ];
    expect(await collect(streamOf(chunks))).toEqual([
      { type: 'text', text: 'Café’s' },
      { type: 'done', remainingToday: 4, cutShort: true },
    ]);
  });

  it('throws on a malformed line', async () => {
    const encoder = new TextEncoder();
    const body = streamOf([encoder.encode('{"type":"text","text":"a"}\ngarbage\n')]);
    await expect(collect(body)).rejects.toThrow('malformed tutor stream');
  });

  it('maps an unknown replace key to unavailable', () => {
    expect(toReplaceKey('cannotHelp')).toBe('cannotHelp');
    expect(toReplaceKey('unavailable')).toBe('unavailable');
    expect(toReplaceKey('x')).toBe('unavailable');
  });
});

describe('failures', () => {
  it('reads the code from the body, or from the status', () => {
    expect(failureOf(429, { error: { code: 'rate_limited', retryAfterSeconds: 37 } })).toEqual({
      code: 'rate_limited',
      retryAfterSeconds: 37,
    });
    expect(failureOf(403, { error: { code: 'forbidden' } })).toEqual({
      code: 'forbidden',
      retryAfterSeconds: null,
    });
    expect(failureOf(400, null)).toEqual({ code: 'validation', retryAfterSeconds: null });
    expect(failureOf(401, 'html')).toEqual({ code: 'unauthenticated', retryAfterSeconds: null });
    expect(failureOf(403, {})).toEqual({ code: 'forbidden', retryAfterSeconds: null });
    expect(failureOf(429, { error: { code: 'nope' } })).toEqual({
      code: 'rate_limited',
      retryAfterSeconds: null,
    });
    expect(failureOf(502, null)).toEqual({ code: 'internal', retryAfterSeconds: null });
  });

  it('turns lasting failures into a block and transient ones into nothing', () => {
    expect(blockFor(failureOf(401, null))).toEqual({ kind: 'unauthenticated' });
    expect(blockFor(failureOf(403, null))).toEqual({ kind: 'forbidden' });
    expect(blockFor({ code: 'rate_limited', retryAfterSeconds: 37 })).toEqual({
      kind: 'cooldown',
      seconds: 37,
    });
    expect(blockFor({ code: 'rate_limited', retryAfterSeconds: 3_600 })).toEqual({
      kind: 'limit',
    });
    expect(blockFor({ code: 'rate_limited', retryAfterSeconds: null })).toEqual({ kind: 'limit' });
    expect(blockFor(failureOf(400, null))).toBeNull();
    expect(blockFor(failureOf(500, null))).toBeNull();
  });
});

describe('activityLabHref', () => {
  const studentLesson = '/student/learn/courses/c/lessons/l';
  it('links a student to a tool that can be opened', () => {
    expect(activityLabHref('text', studentLesson)).toBe('/student/ai-lab/text');
    expect(activityLabHref('image', studentLesson)).toBe('/student/ai-lab/image');
  });
  it('gives no link for no tool, an unknown or coming-soon tool, or outside the student area', () => {
    expect(activityLabHref(null, studentLesson)).toBeNull();
    expect(activityLabHref('ml-lab', studentLesson)).toBeNull();
    expect(activityLabHref('nope', studentLesson)).toBeNull();
    expect(activityLabHref('text', '/teacher/courses/c/lessons/l')).toBeNull();
  });
});
