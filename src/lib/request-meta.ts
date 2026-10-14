import 'server-only';
import { createHmac } from 'node:crypto';
import { headers } from 'next/headers';
import { getServerEnv } from '@/lib/env';

/**
 * HMAC-SHA256 of an address under RATE_LIMIT_SECRET, as 64 hex characters: stable for one
 * client, useless for recovering the address, and safe inside a composite document id.
 */
export function hashClientAddress(address: string): string {
  return createHmac('sha256', getServerEnv().rateLimitSecret)
    .update(address.trim().toLowerCase())
    .digest('hex');
}

/**
 * The key the anonymous rate limits count by: a keyed hash of the caller's IP address, so no
 * raw address is ever stored.
 *
 * The address is taken from the headers the hosting platform sets. Vercel overwrites both on
 * the way in, so a client cannot choose its own value there; behind any other proxy the first
 * entry of X-Forwarded-For is only as trustworthy as that proxy. Without either header (local
 * development) every caller shares one key.
 */
export async function getClientKey(): Promise<string> {
  const requestHeaders = await headers();
  const address =
    requestHeaders.get('x-real-ip') ??
    requestHeaders.get('x-forwarded-for')?.split(',')[0] ??
    'unknown';
  return hashClientAddress(address || 'unknown');
}
