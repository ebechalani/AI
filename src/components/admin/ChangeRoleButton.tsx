'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { ChangeRoleDialog } from './ChangeRoleDialog';
import type { UserRowData } from './user-model';

export interface ChangeRoleButtonProps {
  user: UserRowData;
  focusAfterRemovalId: string;
}

/** "Change role": opens the role dialog, fresh from the stored account on every opening. */
export function ChangeRoleButton({ user, focusAfterRemovalId }: ChangeRoleButtonProps) {
  const t = useTranslations('admin');
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(0);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        aria-label={t('users.role.actionLabel', { name: user.displayName })}
        onClick={() => {
          setOpening((count) => count + 1);
          setOpen(true);
        }}
      >
        {t('users.role.action')}
      </Button>
      <ChangeRoleDialog
        key={opening}
        open={open}
        onClose={() => setOpen(false)}
        user={user}
        focusAfterRemovalId={focusAfterRemovalId}
      />
    </>
  );
}
