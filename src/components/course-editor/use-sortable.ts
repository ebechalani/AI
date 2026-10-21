import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

// Drag-to-reorder with a pointer (5.5). The keyboard way is the Up / Down buttons; the handle is
// pointer only and out of the tab order. Item rectangles are read once, at the press, in page
// coordinates, so the window may scroll while dragging.

const TOP_BAR_PX = 64;
const EDGE_PX = 48;
const SCROLL_STEP_PX = 12;

interface DragState {
  id: string;
  fromIndex: number;
  /** Vertical midpoints of the other items, in page coordinates, in list order. */
  midpoints: number[];
  dropIndex: number;
}

export interface SortableHandleProps {
  onPointerDown(event: ReactPointerEvent<HTMLElement>): void;
  onPointerMove(event: ReactPointerEvent<HTMLElement>): void;
  onPointerUp(event: ReactPointerEvent<HTMLElement>): void;
  onPointerCancel(event: ReactPointerEvent<HTMLElement>): void;
}

export interface Sortable {
  handleProps(id: string): SortableHandleProps;
  itemRef(id: string): (element: HTMLElement | null) => void;
  draggingId: string | null;
  /**
   * Where the drop line goes: before the item at this index of the list, or after the last item
   * when it equals the length; null while nothing would move.
   */
  indicatorSlot: number | null;
}

export function useSortable({
  ids,
  onMove,
  disabled = false,
}: {
  ids: readonly string[];
  onMove(id: string, toIndex: number): void;
  disabled?: boolean;
}): Sortable {
  const items = useRef(new Map<string, HTMLElement>());
  const dragRef = useRef<DragState | null>(null);
  const [drag, setDrag] = useState<{ id: string; fromIndex: number; dropIndex: number } | null>(
    null,
  );

  // Escape cancels a drag.
  useEffect(() => {
    if (drag === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      dragRef.current = null;
      setDrag(null);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drag]);

  function end(commit: boolean) {
    const state = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    if (commit && state !== null && state.dropIndex !== state.fromIndex) {
      onMove(state.id, state.dropIndex);
    }
  }

  function handleProps(id: string): SortableHandleProps {
    return {
      onPointerDown(event) {
        if (disabled || event.button !== 0) return;
        const fromIndex = ids.indexOf(id);
        if (fromIndex === -1) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        const midpoints = ids
          .filter((other) => other !== id)
          .map((other) => {
            const box = items.current.get(other)?.getBoundingClientRect();
            return box ? box.top + window.scrollY + box.height / 2 : Number.POSITIVE_INFINITY;
          });
        dragRef.current = { id, fromIndex, midpoints, dropIndex: fromIndex };
        setDrag({ id, fromIndex, dropIndex: fromIndex });
      },
      onPointerMove(event) {
        const state = dragRef.current;
        if (state === null || state.id !== id) return;
        if (event.clientY < TOP_BAR_PX + EDGE_PX) window.scrollBy(0, -SCROLL_STEP_PX);
        else if (event.clientY > window.innerHeight - EDGE_PX) window.scrollBy(0, SCROLL_STEP_PX);
        const y = event.clientY + window.scrollY;
        const dropIndex = state.midpoints.filter((mid) => mid < y).length;
        if (dropIndex === state.dropIndex) return;
        state.dropIndex = dropIndex;
        setDrag({ id, fromIndex: state.fromIndex, dropIndex });
      },
      onPointerUp(event) {
        if (dragRef.current?.id !== id) return;
        event.currentTarget.releasePointerCapture?.(event.pointerId);
        end(true);
      },
      onPointerCancel() {
        if (dragRef.current?.id === id) end(false);
      },
    };
  }

  function itemRef(id: string) {
    return (element: HTMLElement | null) => {
      if (element === null) items.current.delete(id);
      else items.current.set(id, element);
    };
  }

  let indicatorSlot: number | null = null;
  if (drag !== null && drag.dropIndex !== drag.fromIndex) {
    indicatorSlot = drag.dropIndex < drag.fromIndex ? drag.dropIndex : drag.dropIndex + 1;
  }

  return { handleProps, itemRef, draggingId: drag?.id ?? null, indicatorSlot };
}
