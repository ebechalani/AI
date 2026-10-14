import 'server-only';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { collections, docIds, utcHourKey } from '@/lib/firebase/collections';
import { createdNow, updatedNow } from '@/lib/firebase/converters';
import { RATE_LIMITS, type RateLimitScope } from '@/lib/limits';
import { isId } from './internal-identity';

const HOUR_MS = 60 * 60 * 1000;

/**
 * Counts one request in the current one-hour window of `scope` and `key`, unless the window
 * is full. It takes no actor: its callers are the entry points that have no session yet, or
 * that limit a signed-in user by uid.
 *
 * `key` goes into the document id as it is: the caller passes `getClientKey()` (a keyed hash
 * of the client address, never the address) for the anonymous scopes and the uid for
 * 'join_class'.
 */
export async function consumeRateLimit(
  scope: RateLimitScope,
  key: string,
): Promise<{ allowed: boolean; retryAfterSeconds: number | null }> {
  if (!Object.hasOwn(RATE_LIMITS, scope)) throw new Error('Unknown rate-limit scope.');
  if (!isId(key)) throw new Error('A rate-limit key is a hash or a uid.');
  const limit = RATE_LIMITS[scope];
  const now = new Date();
  const windowEnd = (Math.floor(now.getTime() / HOUR_MS) + 1) * HOUR_MS;
  const ref = collections.rateLimits().doc(docIds.rateLimit(scope, key, utcHourKey(now)));

  return getAdminDb().runTransaction(async (tx) => {
    const bucket = await tx.get(ref);
    const used = Number(bucket.get('count') ?? 0);
    if (used >= limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((windowEnd - now.getTime()) / 1000));
      return { allowed: false, retryAfterSeconds };
    }
    if (bucket.exists) {
      tx.update(ref, { count: used + 1, ...updatedNow() });
    } else {
      // expiresAt is what scripts/cleanup-uploads.ts deletes old buckets by.
      tx.create(ref, {
        scope,
        count: 1,
        expiresAt: Timestamp.fromMillis(windowEnd),
        ...createdNow(),
      });
    }
    return { allowed: true, retryAfterSeconds: null };
  });
}
