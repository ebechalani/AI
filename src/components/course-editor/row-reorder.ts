import type { ReorderList } from './use-reorder-list';
import type { Sortable, SortableHandleProps } from './use-sortable';

// What one row of a sortable list needs from its list (5.5): its grip, one keyboard step, and
// whether the list is saving a move. The row's element ref (`sortable.itemRef(id)`) travels as
// a prop of its own: an object with a property passed to `ref=` counts as a ref container for
// the React Compiler lint, and none of its other properties could then be read while rendering.

export interface RowReorder {
  handle: SortableHandleProps;
  /** One keyboard step; the list keeps the focus on the right button. */
  step(delta: -1 | 1): void;
  busy: boolean;
  /** This row is being dragged. */
  dragging: boolean;
}

export function rowReorder(
  list: ReorderList,
  sortable: Sortable,
  id: string,
  idPrefix: string,
): RowReorder {
  return {
    handle: sortable.handleProps(id),
    step: (delta) => list.step(id, delta, idPrefix),
    busy: list.busy,
    dragging: sortable.draggingId === id,
  };
}
