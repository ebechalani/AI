import { useState } from 'react';
import { useToast } from '@/components/ui';
import type { ActionResult } from '@/types/actions';
import { conflictMessageKey, type ConflictContext } from './errors-model';
import { useEditorAction } from './use-editor-action';

// A confirmation dialog's action (deletes, status changes, cover removal). A failure stays in
// the dialog, unless it means the page is stale (the item is gone, the course is locked…): then
// the dialog closes, the page refreshes and a toast says why (3.1).

export interface ConfirmedAction {
  open: boolean;
  show(): void;
  close(): void;
  pending: boolean;
  error: string | null;
  confirm<T>(
    call: () => Promise<ActionResult<T>>,
    options: { context?: ConflictContext; onSuccess(data: T): void },
  ): Promise<void>;
}

export function useConfirmedAction(): ConfirmedAction {
  const { run } = useEditorAction();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm<T>(
    call: () => Promise<ActionResult<T>>,
    options: { context?: ConflictContext; onSuccess(data: T): void },
  ) {
    if (pending) return;
    setPending(true);
    setError(null);
    const reported = { message: null as string | null };
    const result = await run(call, {
      context: options.context,
      report: (failure) => {
        reported.message = failure.message;
      },
    });
    setPending(false);
    if (result.ok) {
      setOpen(false);
      options.onSuccess(result.data);
      return;
    }
    const { code } = result.error;
    const stale =
      code === 'not_found' ||
      code === 'forbidden' ||
      (code === 'conflict' && conflictMessageKey(options.context ?? { action: 'other' }).refresh);
    if (stale) {
      setOpen(false);
      if (reported.message !== null) toast({ tone: 'danger', title: reported.message });
      return;
    }
    setError(reported.message);
  }

  return {
    open,
    show() {
      setError(null);
      setOpen(true);
    },
    close() {
      setOpen(false);
    },
    pending,
    error,
    confirm,
  };
}
