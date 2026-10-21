import { useState } from 'react';
import { isDirty, stableKey, syncDecision } from './sync-model';

// A long-lived form's state and what a new server version means for it (5.4). Server versions
// arrive as props after a refresh; the decision is taken while rendering (the React "adjust
// state when a prop changes" pattern), never in an effect.

interface SyncState<D> {
  draft: D;
  /** What the form started from, or last saved. */
  base: D;
  seenKey: string;
  /** The latest server version (differs from `base` only during a conflict). */
  latest: D;
  conflict: boolean;
  /** The next server change is this form's own save coming back. */
  ownSave: boolean;
  /** The save's refresh, as last seen. */
  refreshing: boolean;
}

export interface ServerSync<D> {
  draft: D;
  setDraft(next: D | ((current: D) => D)): void;
  base: D;
  dirty: boolean;
  /** The server changed while the form was dirty. */
  conflict: boolean;
  /** draft = base = the latest server version (drops the user's edits). */
  takeTheirs(): void;
  /** base = the latest server version, draft unchanged (the next save overwrites it). */
  keepMine(): void;
  /** base = draft; the refreshed props that follow are this save. */
  markSaved(): void;
  /** draft = base (during a conflict: the latest server version). */
  discard(): void;
}

/**
 * `refreshing` is the save's refresh transition (`useEditorAction().refreshing`): when it ends
 * without a new server version, nothing changed on the server and the own-save mark is dropped,
 * so a later change from another tab is judged normally.
 */
export function useServerSync<D>(serverDraft: D, options: { refreshing?: boolean } = {}): ServerSync<D> {
  const refreshing = options.refreshing ?? false;
  const serverKey = stableKey(serverDraft);
  const [state, setState] = useState<SyncState<D>>(() => ({
    draft: serverDraft,
    base: serverDraft,
    seenKey: serverKey,
    latest: serverDraft,
    conflict: false,
    ownSave: false,
    refreshing,
  }));

  let current = state;
  if (serverKey !== current.seenKey) {
    const decision = syncDecision({
      seenServerKey: current.seenKey,
      serverKey,
      dirty: isDirty(current.draft, current.base),
      ownSave: current.ownSave,
    });
    const next =
      decision === 'reset'
        ? { draft: serverDraft, base: serverDraft, latest: serverDraft, conflict: false }
        : decision === 'conflict'
          ? { latest: serverDraft, conflict: true }
          : { base: serverDraft, latest: serverDraft };
    current = { ...current, ...next, seenKey: serverKey, ownSave: false };
  }
  if (refreshing !== current.refreshing) {
    current = { ...current, refreshing, ownSave: refreshing ? current.ownSave : false };
  }
  if (current !== state) setState(current);

  return {
    draft: current.draft,
    base: current.base,
    dirty: isDirty(current.draft, current.base),
    conflict: current.conflict,
    setDraft(next) {
      setState((s) => ({
        ...s,
        draft: typeof next === 'function' ? (next as (value: D) => D)(s.draft) : next,
      }));
    },
    takeTheirs() {
      setState((s) => ({ ...s, draft: s.latest, base: s.latest, conflict: false }));
    },
    keepMine() {
      setState((s) => ({ ...s, base: s.latest, conflict: false }));
    },
    markSaved() {
      setState((s) => ({ ...s, base: s.draft, ownSave: true }));
    },
    discard() {
      setState((s) =>
        s.conflict
          ? { ...s, draft: s.latest, base: s.latest, conflict: false }
          : { ...s, draft: s.base },
      );
    },
  };
}
