import { after } from 'next/server';
import { describeAiFailure } from '@/lib/ai/log';
import {
  encodeTutorEvent,
  guardTutorStream,
  streamTutorReply,
  toTutorStreamEvent,
  TUTOR_STREAM_CONTENT_TYPE,
  type GuardedTutorEvent,
} from '@/lib/ai/tutor';
import type { TutorContext } from '@/lib/ai/types';
import { recordAiBlocked, recordAiTokens } from '@/lib/data/ai-usage';
import type { TutorTurn } from '@/types/ai';
import type { Session } from '@/types/user';

type DoneEvent = Extract<GuardedTutorEvent, { type: 'done' }>;

/** Records what the reply cost. Never throws: accounting must not break the reply. */
async function settle(session: Session, done: DoneEvent, signal: AbortSignal): Promise<void> {
  try {
    await recordAiTokens(session, done.usage);
    if (done.outcome === 'blocked') await recordAiBlocked(session);
  } catch (error: unknown) {
    console.error(`[api/ai/tutor] usage accounting failed: ${describeAiFailure(error)}`);
  }
  // A reply cut off because the learner left is not an error.
  if (done.error !== null && !signal.aborted) {
    console.error(`[api/ai/tutor] ${describeAiFailure(done.error)}`);
  }
}

/**
 * The NDJSON reply (ARCHITECTURE.md 8.3): guarded events, one per line, ending with exactly one
 * `done`. The response closes right after `done`; the accounting runs after it, kept alive by
 * `after()`. The pump never rejects. A client that leaves aborts the provider call through
 * `signal`, and the usage known so far is still recorded.
 */
export function streamTutorResponse(args: {
  session: Session;
  context: TutorContext;
  messages: TutorTurn[];
  remainingToday: number;
  signal: AbortSignal;
}): Response {
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  const pump = (async () => {
    let open = true;
    // Ends the HTTP response exactly once.
    const finish = async () => {
      if (open) {
        open = false;
        await writer.close().catch(() => undefined);
      }
    };
    try {
      const events = guardTutorStream(
        streamTutorReply(args.context, args.messages, { signal: args.signal }),
        args.context.ageBand,
      );
      for await (const event of events) {
        if (open) {
          // Encoding faults are server faults (caught below), not a client that went away.
          const line = encoder.encode(
            encodeTutorEvent(toTutorStreamEvent(event, args.remainingToday)),
          );
          try {
            await writer.write(line);
          } catch {
            open = false; // the client went away; keep consuming for the usage
          }
        }
        if (event.type === 'done') {
          await finish(); // the learner is not kept waiting for the accounting
          await settle(args.session, event, args.signal);
        }
      }
    } catch (error: unknown) {
      console.error(`[api/ai/tutor] stream pump failed: ${describeAiFailure(error)}`);
      if (open) {
        open = false;
        // The client sees a broken stream, never a hang.
        await writer.abort(error).catch(() => undefined);
      }
    } finally {
      await finish();
    }
  })();

  after(() => pump);

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': TUTOR_STREAM_CONTENT_TYPE,
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
