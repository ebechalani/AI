import { getSession, assertSessionNotRevoked } from '@/lib/auth/session';
import type { TutorContext } from '@/lib/ai/types';
import { checkAndCountAiUsage } from '@/lib/data/ai-usage';
import { UnauthenticatedError } from '@/lib/errors';
import { tutorRequestSchema } from '@/lib/schemas/ai';
import { parseInput } from '@/lib/schemas/common';
import { buildTutorContext } from '@/lib/services/tutor-context';
import { contextFailure, isSameOrigin, jsonError, readJsonBody, usageRefusal } from './_lib/http';
import { streamTutorResponse } from './_lib/stream';

// Covers the provider call (50 s deadline) and the accounting that runs after the response.
export const maxDuration = 60;

/**
 * One tutor reply, streamed as NDJSON (ARCHITECTURE.md 1.7, 6.9, 8.3). The checks run in the
 * order of 1.7: origin, session, role, revocation (staff), body, schema, usage (counted here,
 * which also applies the school switch), context. Failures answer JSON with `no-store`.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request.headers)) return jsonError(403, 'forbidden');
  try {
    const session = await getSession();
    if (session === null) return jsonError(401, 'unauthenticated');
    if (session.role !== 'student' && session.role !== 'teacher') {
      return jsonError(403, 'forbidden');
    }
    // The same rule as runAction: staff sessions are checked against revocation.
    if (session.role === 'teacher') await assertSessionNotRevoked();

    const body = await readJsonBody(request);
    if (!body.ok) return jsonError(400, 'validation');
    const parsed = parseInput(tutorRequestSchema, body.value);
    if (!parsed.success) return jsonError(400, 'validation');
    const { mode, courseId, lessonId, locale, messages } = parsed.data;

    const decision = await checkAndCountAiUsage(session, 'tutor');
    const refusal = usageRefusal(decision);
    if (refusal !== null) return refusal;

    let context: TutorContext;
    try {
      context = await buildTutorContext(session, { mode, courseId, lessonId, locale });
    } catch (error: unknown) {
      return contextFailure(error);
    }

    return streamTutorResponse({
      session,
      context,
      messages,
      remainingToday: decision.remainingToday,
      signal: request.signal,
    });
  } catch (error: unknown) {
    if (error instanceof UnauthenticatedError) return jsonError(401, 'unauthenticated');
    console.error('[api/ai/tutor] unexpected error', error);
    return jsonError(500, 'internal');
  }
}
