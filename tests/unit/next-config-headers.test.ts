import { describe, expect, it } from 'vitest';
import config from '../../next.config';

// The response headers of next.config.ts (ARCHITECTURE.md 11.1). Files served by
// GET /api/files/[fileId] must not leak their URL through the Referer header (1.4, 6.9;
// foundation request WS-D-3). Next writes the config headers before the route handler runs and
// keeps them over the handler's own, and when two entries set the same key the last one wins,
// so the /api/files entry has to come after the site-wide one.

type HeaderEntry = { source: string; headers: { key: string; value: string }[] };

async function headerEntries(): Promise<HeaderEntry[]> {
  const resolved = await config();
  expect(resolved.headers).toBeTypeOf('function');
  return (await resolved.headers!()) as HeaderEntry[];
}

function referrerPolicy(entry: HeaderEntry): string | undefined {
  return entry.headers.find((header) => header.key.toLowerCase() === 'referrer-policy')?.value;
}

describe('next.config headers', () => {
  it('keeps the site-wide referrer policy on every path', async () => {
    const entries = await headerEntries();
    const siteWide = entries.find((entry) => entry.source === '/(.*)');
    expect(siteWide).toBeDefined();
    expect(referrerPolicy(siteWide!)).toBe('strict-origin-when-cross-origin');
  });

  it('sends no referrer from /api/files, in the last entry that sets the policy', async () => {
    const entries = await headerEntries();
    const files = entries.findIndex((entry) => entry.source === '/api/files/:path*');
    expect(files).toBeGreaterThan(entries.findIndex((entry) => entry.source === '/(.*)'));
    expect(referrerPolicy(entries[files]!)).toBe('no-referrer');
    expect(entries[files]!.headers).toHaveLength(1);
    // Nothing after it may set the policy again.
    expect(entries.slice(files + 1).filter((entry) => referrerPolicy(entry) !== undefined)).toEqual(
      [],
    );
  });
});
