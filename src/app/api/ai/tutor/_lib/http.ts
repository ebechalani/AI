import type { AiUsageDecision } from '@/lib/data/ai-usage';
import { isAppError } from '@/lib/errors';
import type { ActionErrorCode } from '@/types/actions';

// Request checks and JSON failures of POST /api/ai/tutor (ARCHITECTURE.md 6.9). A failure
// answers `{ error: { code, retryAfterSeconds? } }`, never field errors or messages.

/** Larger bodies are refused unread: ten turns at their maximum fit in well under this. */
export const MAX_BODY_BYTES = 128 * 1024;

/** A 429 without a delay from the usage gate asks the client to wait this long. */
const DEFAULT_RETRY_AFTER_SECONDS = 60;

/**
 * The browser's `Origin` must name this host (the first `x-forwarded-host`, else `host`), as
 * Next checks for server actions. A missing, opaque (`null`) or foreign origin fails.
 */
export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get('origin');
  if (origin === null || origin === '') return false;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  const forwarded = headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = (forwarded || headers.get('host') || '').toLowerCase();
  return host !== '' && url.host.toLowerCase() === host;
}

export type JsonBody = { ok: true; value: unknown } | { ok: false };

/**
 * Reads at most MAX_BODY_BYTES. A declared length above it is refused without reading; a
 * chunked body is counted while it arrives and the reader is cancelled as soon as it passes
 * the limit (`request.text()` would buffer all of it). Then strict UTF-8 and JSON.
 */
export async function readJsonBody(request: Request): Promise<JsonBody> {
  const declared = request.headers.get('content-length');
  if (declared !== null) {
    const length = Number(declared);
    if (!Number.isFinite(length) || length > MAX_BODY_BYTES) return { ok: false };
  }
  if (request.body === null) return { ok: false };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => undefined);
        return { ok: false };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false };
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}

export function jsonError(
  status: number,
  code: ActionErrorCode,
  retryAfterSeconds?: number,
): Response {
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  if (retryAfterSeconds !== undefined) headers.set('Retry-After', String(retryAfterSeconds));
  const error = retryAfterSeconds === undefined ? { code } : { code, retryAfterSeconds };
  return Response.json({ error }, { status, headers });
}

/** null when the message may be sent; otherwise the answer for the refusal. */
export function usageRefusal(decision: AiUsageDecision): Response | null {
  if (decision.allowed) return null;
  if (decision.reason === 'limit' || decision.reason === 'budget') {
    return jsonError(
      429,
      'rate_limited',
      decision.retryAfterSeconds ?? DEFAULT_RETRY_AFTER_SECONDS,
    );
  }
  return jsonError(403, 'forbidden');
}

/**
 * The answer for a context that could not be built. A course the caller may not open (hidden,
 * not licensed, unknown) is `forbidden` (10.4). Anything unexpected is thrown again.
 */
export function contextFailure(error: unknown): Response {
  if (isAppError(error)) {
    switch (error.code) {
      case 'not_found':
      case 'forbidden':
      case 'license_required':
        return jsonError(403, 'forbidden');
      case 'validation':
        return jsonError(400, 'validation');
      case 'unauthenticated':
        return jsonError(401, 'unauthenticated');
      default:
        break;
    }
  }
  throw error;
}
