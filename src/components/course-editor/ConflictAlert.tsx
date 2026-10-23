'use client';

import type { MouseEvent, Ref } from 'react';
import { flushSync } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Alert, Button } from '@/components/ui';
import { firstField } from './focus';

/** The alert's focusable wrapper, for "Load the changes" (the sync notice) to find it. */
export const CONFLICT_ALERT_SELECTOR = '[data-conflict-alert]';

/**
 * Someone saved a new version while this form had unsaved changes (5.4). Save is blocked until
 * the author chooses; pressing it focuses this alert (`ref` is its focusable wrapper). The alert
 * goes away with the choice, so the focus moves on to the form's first field.
 */
export function ConflictAlert({
  ref,
  onTakeTheirs,
  onKeepMine,
}: {
  ref?: Ref<HTMLDivElement>;
  onTakeTheirs(): void;
  onKeepMine(): void;
}) {
  const t = useTranslations('courseEditor');

  function choose(event: MouseEvent<HTMLButtonElement>, handler: () => void) {
    const form = event.currentTarget.closest('form');
    flushSync(handler);
    firstField(form)?.focus();
  }

  return (
    <div
      ref={ref}
      tabIndex={-1}
      data-conflict-alert=""
      className="rounded-control"
    >
      <Alert
        tone="warning"
        live="assertive"
        title={t('conflict.title')}
        action={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={(event) => choose(event, onTakeTheirs)}>
              {t('conflict.takeTheirs')}
            </Button>
            <Button size="sm" variant="ghost" onClick={(event) => choose(event, onKeepMine)}>
              {t('conflict.keepMine')}
            </Button>
          </div>
        }
      >
        {t('conflict.description')}
      </Alert>
    </div>
  );
}
