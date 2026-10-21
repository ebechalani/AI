'use client';

import type { ReactNode } from 'react';
import { EditorEventsProvider } from './editor-events';
import { SyncNotice } from './SyncNotice';
import { UnsavedChangesProvider } from './unsaved-changes';

/** Wraps every editor page: the unsaved-changes guard, saves from other tabs, the sync notice. */
export function EditorFrame({ courseId, children }: { courseId: string; children: ReactNode }) {
  return (
    <UnsavedChangesProvider>
      <EditorEventsProvider courseId={courseId}>
        <SyncNotice />
        {children}
      </EditorEventsProvider>
    </UnsavedChangesProvider>
  );
}
