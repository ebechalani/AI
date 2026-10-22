'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, type ButtonSize } from '@/components/ui';
import { CreateSchoolDialog } from './CreateSchoolDialog';

export interface CreateSchoolButtonProps {
  size?: ButtonSize;
}

/** "New school": opens the creation dialog, fresh on every opening (a new `key`). */
export function CreateSchoolButton({ size }: CreateSchoolButtonProps) {
  const t = useTranslations('admin');
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(0);

  return (
    <>
      <Button
        size={size}
        onClick={() => {
          setOpening((count) => count + 1);
          setOpen(true);
        }}
      >
        <Plus aria-hidden="true" />
        {t('schools.create.action')}
      </Button>
      <CreateSchoolDialog key={opening} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
