'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTimeZone, useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import type { License } from '@/types/billing';
import type { PathwayChoice, SubscriptionOption } from './billing-model';
import { isoToDateInput, safeTimeZone } from './dates';
import { LicenseDialog } from './LicenseDialog';
import type { SchoolChoice } from './school-model';

export interface LicenseButtonProps {
  mode: 'create' | 'edit';
  license?: License;
  /** The school of the licence; null on the global list, where the dialog offers a school select. */
  schoolId: string | null;
  /** The school's name, shown read-only while editing (the table knows it, the school page need not). */
  schoolName?: string;
  schools: SchoolChoice[];
  pathways: PathwayChoice[];
  subscriptionOptions: SubscriptionOption[] | null;
}

/** "New license" or a row's "Edit": opens the licence dialog, fresh on every opening. */
export function LicenseButton({
  mode,
  license,
  schoolId,
  schoolName,
  schools,
  pathways,
  subscriptionOptions,
}: LicenseButtonProps) {
  const t = useTranslations('admin');
  const tz = safeTimeZone(useTimeZone());
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(0);
  // Today's date in the viewer's zone, taken when the dialog opens (an event, never a render).
  const [today, setToday] = useState('');

  function show() {
    setToday(isoToDateInput(new Date().toISOString(), tz));
    setOpening((count) => count + 1);
    setOpen(true);
  }

  return (
    <>
      {mode === 'create' ? (
        <Button onClick={show}>
          <Plus aria-hidden="true" />
          {t('billing.licenses.add')}
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          aria-label={t('billing.licenses.editLabel', { name: license?.name ?? '' })}
          onClick={show}
        >
          {t('billing.licenses.edit')}
        </Button>
      )}
      <LicenseDialog
        key={opening}
        open={open}
        onClose={() => setOpen(false)}
        mode={mode}
        license={license}
        schoolId={schoolId}
        schoolName={schoolName}
        schools={schools}
        pathways={pathways}
        subscriptionOptions={subscriptionOptions}
        today={today}
      />
    </>
  );
}
