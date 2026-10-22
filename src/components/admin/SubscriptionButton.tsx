'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTimeZone, useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import type { Subscription } from '@/types/billing';
import type { OwnerChoice } from './billing-model';
import { isoToDateInput, safeTimeZone } from './dates';
import type { SchoolChoice } from './school-model';
import { SubscriptionDialog } from './SubscriptionDialog';
import type { CourseChoice } from './SubscriptionsTable';

export interface SubscriptionButtonProps {
  mode: 'create' | 'edit';
  subscription?: Subscription;
  owner: OwnerChoice;
  ownerLabel: string;
  courses: CourseChoice[];
  schools: SchoolChoice[];
}

/** "New subscription" or a row's "Edit": opens the subscription dialog, fresh on every opening. */
export function SubscriptionButton({
  mode,
  subscription,
  owner,
  ownerLabel,
  courses,
  schools,
}: SubscriptionButtonProps) {
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
          {t('billing.subscriptions.add')}
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          aria-label={t('billing.subscriptions.editLabel', { owner: ownerLabel })}
          onClick={show}
        >
          {t('billing.subscriptions.edit')}
        </Button>
      )}
      <SubscriptionDialog
        key={opening}
        open={open}
        onClose={() => setOpen(false)}
        mode={mode}
        subscription={subscription}
        owner={owner}
        ownerLabel={ownerLabel}
        courses={courses}
        schools={schools}
        today={today}
      />
    </>
  );
}
