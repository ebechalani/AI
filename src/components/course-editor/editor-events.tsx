'use client';

import {
  createContext,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { useUnsavedChanges } from './unsaved-changes';

// Saves made in another tab of the same browser (5.4). Every save posts on a BroadcastChannel
// per course; the other tabs refresh, unless one of their forms has unsaved changes: then they
// show the sync notice instead (a refresh could replace the page with the not-found page when
// the item being edited was deleted, and the draft would be lost). A tab that becomes visible
// again refreshes too, when it is clean.

export interface EditorEvents {
  /** Tells the other tabs that something of this course was saved. */
  saved(): void;
  /** A save happened elsewhere while this page had unsaved changes. */
  pending: boolean;
  /** Clears `pending` and refreshes: each form then compares the new version with its own. */
  loadChanges(): void;
}

const NO_EVENTS: EditorEvents = { saved() {}, pending: false, loadChanges() {} };

const EditorEventsContext = createContext<EditorEvents>(NO_EVENTS);

export function useEditorEvents(): EditorEvents {
  return use(EditorEventsContext);
}

export const SYNC_NOTICE_ID = 'editor-sync-notice';

export function EditorEventsProvider({
  courseId,
  children,
}: {
  courseId: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const unsaved = useUnsavedChanges();
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();
  const routerRef = useRef(router);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    routerRef.current = router;
  });

  useEffect(() => {
    const refresh = () => startTransition(() => routerRef.current.refresh());
    const dirty = () => unsaved?.isAnyDirty() ?? false;
    const channel =
      typeof BroadcastChannel === 'undefined'
        ? null
        : new BroadcastChannel(`roboholic-course-editor:${courseId}`);
    channelRef.current = channel;

    function onMessage() {
      if (!dirty()) {
        refresh();
        return;
      }
      pendingRef.current = true;
      setPending(true);
    }
    function onVisibilityChange() {
      if (document.visibilityState === 'visible' && !dirty()) refresh();
    }
    const unsubscribe = unsaved?.subscribeDirty((anyDirty) => {
      if (anyDirty || !pendingRef.current) return;
      pendingRef.current = false;
      setPending(false);
      refresh();
    });

    channel?.addEventListener('message', onMessage);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      channel?.removeEventListener('message', onMessage);
      channel?.close();
      channelRef.current = null;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      unsubscribe?.();
    };
  }, [courseId, unsaved]);

  const events = useMemo<EditorEvents>(
    () => ({
      saved() {
        channelRef.current?.postMessage({ type: 'saved' });
      },
      pending,
      loadChanges() {
        pendingRef.current = false;
        setPending(false);
        startTransition(() => routerRef.current.refresh());
      },
    }),
    [pending],
  );

  return <EditorEventsContext value={events}>{children}</EditorEventsContext>;
}
