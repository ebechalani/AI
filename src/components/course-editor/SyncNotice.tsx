'use client';

import { useTranslations } from 'next-intl';
import { Alert, Button } from '@/components/ui';
import { SYNC_NOTICE_ID, useEditorEvents } from './editor-events';

/** Changes were saved in another tab while this page had unsaved changes (5.4). */
export function SyncNotice() {
  const t = useTranslations('courseEditor');
  const { pending, loadChanges } = useEditorEvents();
  if (!pending) return null;
  return (
    <div
      id={SYNC_NOTICE_ID}
      tabIndex={-1}
      className="mb-6 rounded-control outline-none focus-visible:outline-2"
    >
      <Alert
        tone="warning"
        live="polite"
        action={
          <Button size="sm" onClick={loadChanges}>
            {t('sync.load')}
          </Button>
        }
      >
        {t('sync.pending')}
      </Alert>
    </div>
  );
}

/** Save is blocked while changes from elsewhere are not loaded: focus the notice instead. */
export function focusSyncNotice(): void {
  document.getElementById(SYNC_NOTICE_ID)?.focus();
}
