// How a long-lived form reacts to a new server version of what it edits (5.4).

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const entry = (value as Record<string, unknown>)[key];
      if (entry !== undefined) result[key] = canonical(entry);
    }
    return result;
  }
  return value;
}

/** JSON with object keys sorted at every depth; undefined properties dropped. */
export function stableKey(value: unknown): string {
  return JSON.stringify(canonical(value)) ?? 'undefined';
}

export function isDirty<T>(draft: T, base: T): boolean {
  return stableKey(draft) !== stableKey(base);
}

export type SyncDecision = 'keep' | 'reset' | 'conflict';

/**
 * Same server version → 'keep'. A new one: a clean form takes it ('reset'); a dirty form whose
 * own save just came back keeps its text ('keep', the caller moves the base); a dirty form that
 * did not save → 'conflict'.
 */
export function syncDecision(input: {
  seenServerKey: string;
  serverKey: string;
  dirty: boolean;
  ownSave: boolean;
}): SyncDecision {
  if (input.serverKey === input.seenServerKey) return 'keep';
  if (!input.dirty) return 'reset';
  return input.ownSave ? 'keep' : 'conflict';
}
