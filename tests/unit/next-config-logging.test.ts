import { describe, expect, it } from 'vitest';
import config from '../../next.config';

// `next dev` logs every Server Function call with its arguments unless the config says not to,
// and those arguments carry learners' text (AI Lab prompts, project work, quiz answers, names)
// and session ID tokens (foundation request WS-I-2; ARCHITECTURE.md 2, 8.1 and 12: no personal
// data in logs).

describe('next.config logging', () => {
  it('never logs Server Function arguments, after the next-intl plugin has run', async () => {
    const resolved = await config();
    expect(resolved.logging).toBeTypeOf('object');
    expect(resolved.logging === false ? null : resolved.logging?.serverFunctions).toBe(false);
  });

  it('keeps the rest of the logging at its defaults (requests and fetches are still logged)', async () => {
    const resolved = await config();
    expect(resolved.logging).toEqual({ serverFunctions: false });
  });
});
