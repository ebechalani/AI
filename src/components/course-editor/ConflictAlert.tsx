'use client';

import type { Ref } from 'react';
import { useTranslations } from 'next-intl';
import { Alert, Button } from '@/components/ui';

/**
 * Someone saved a new version while this form had unsaved changes (5.4). Save is blocked until
 * the author chooses; pressing it focuses this alert (`ref` is its focusable wrapper).
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
  return (
    <div ref={ref} tabIndex={-1} className="rounded-control outline-none focus-visible:outline-2">
      <Alert
        tone="warning"
        live="assertive"
        title={t('conflict.title')}
        action={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={onTakeTheirs}>
              {t('conflict.takeTheirs')}
            </Button>
            <Button size="sm" variant="ghost" onClick={onKeepMine}>
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
