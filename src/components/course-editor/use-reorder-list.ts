import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ActionResult } from '@/types/actions';
import { usePendingFocus } from './focus';
import { moveId, moveResult } from './outline-model';
import { focusAfterMove } from './ReorderButtons';
import { useEditorAction } from './use-editor-action';

// The optimistic order of a sortable list (5.5): a move shows at once and is saved; a failure
// puts the server's order back and says why; a success refreshes and is announced politely.

export interface ReorderList {
  order: string[];
  busy: boolean;
  announcement: string;
  /** Drag: move `id` to `toIndex`. */
  moveTo(id: string, toIndex: number): void;
  /** Buttons: one step, keeping the focus on the same button (or the other one at an edge). */
  step(id: string, delta: -1 | 1, idPrefix: string): void;
}

export function useReorderList({
  ids,
  save,
  nameOf,
}: {
  ids: readonly string[];
  save(orderedIds: string[]): Promise<ActionResult<null>>;
  nameOf(id: string): string;
}): ReorderList {
  const t = useTranslations('courseEditor');
  const { run, refresh } = useEditorAction();
  const focusLater = usePendingFocus();
  const key = ids.join('\n');
  const [state, setState] = useState({ key, order: [...ids] });
  const [busy, setBusy] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  let order = state.order;
  if (state.key !== key) {
    order = [...ids];
    setState({ key, order });
  }

  async function moveTo(id: string, toIndex: number, focusId?: string) {
    if (busy) return;
    const next = moveId(order, id, toIndex);
    if (next.join('\n') === order.join('\n')) return;
    const serverOrder = [...ids];
    setState({ key, order: next });
    setBusy(true);
    if (focusId !== undefined) focusLater(focusId);
    const result = await run(() => save(next), { context: { action: 'reorder' }, report: 'toast' });
    setBusy(false);
    if (!result.ok) {
      setState({ key, order: serverOrder });
      return;
    }
    setAnnouncement(
      t('reorder.moved', { name: nameOf(id), position: next.indexOf(id) + 1, count: next.length }),
    );
    refresh();
  }

  function step(id: string, delta: -1 | 1, idPrefix: string) {
    const moved = moveResult(order, id, delta);
    if (moved === null) return;
    void moveTo(id, moved.index, focusAfterMove(idPrefix, delta, moved.index, order.length));
  }

  return {
    order,
    busy,
    announcement,
    moveTo: (id, toIndex) => void moveTo(id, toIndex),
    step,
  };
}
