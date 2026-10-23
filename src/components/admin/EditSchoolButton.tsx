'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import type { School } from '@/types/school';
import { EditSchoolDialog } from './EditSchoolDialog';

export interface EditSchoolButtonProps {
  school: School;
}

/** "Edit school": opens the edit dialog, fresh from the stored school on every opening. */
export function EditSchoolButton({ school }: EditSchoolButtonProps) {
  const t = useTranslations('admin');
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(0);

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          setOpening((count) => count + 1);
          setOpen(true);
        }}
      >
        <Pencil aria-hidden="true" />
        {t('schools.edit.action')}
      </Button>
      <EditSchoolDialog key={opening} open={open} onClose={() => setOpen(false)} school={school} />
    </>
  );
}
