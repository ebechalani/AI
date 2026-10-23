'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { CreateSchoolClassDialog, type OwnerOption } from './CreateSchoolClassDialog';

/** "New class": rendered only when the school has an active teacher to own it. */
export function CreateSchoolClassButton({ teachers }: { teachers: OwnerOption[] }) {
  const t = useTranslations('school');
  const [open, setOpen] = useState(false);
  // A new key for every opening: the fields start empty each time.
  const [opening, setOpening] = useState(0);

  return (
    <>
      <Button
        onClick={() => {
          setOpening((value) => value + 1);
          setOpen(true);
        }}
      >
        <Plus aria-hidden="true" />
        {t('classes.create.action')}
      </Button>
      <CreateSchoolClassDialog
        key={opening}
        open={open}
        onClose={() => setOpen(false)}
        teachers={teachers}
      />
    </>
  );
}
