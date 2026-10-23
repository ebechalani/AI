'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { AddTeacherDialog } from './AddTeacherDialog';

/** "Add a teacher": always in the page header, so the dialog's owner never moves. */
export function AddTeacherButton() {
  const t = useTranslations('school');
  const [open, setOpen] = useState(false);
  // A new key for every opening: the dialog starts with empty fields each time.
  const [opening, setOpening] = useState(0);

  return (
    <>
      <Button
        onClick={() => {
          setOpening((value) => value + 1);
          setOpen(true);
        }}
      >
        <UserPlus aria-hidden="true" />
        {t('teachers.add.action')}
      </Button>
      <AddTeacherDialog key={opening} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
