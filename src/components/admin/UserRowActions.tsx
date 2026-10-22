'use client';

import { useTranslations } from 'next-intl';
import { Chip } from '@/components/ui';
import { ChangeRoleButton } from './ChangeRoleButton';
import { userRowPermissions, type UserRowData } from './user-model';
import { UserStatusButton } from './UserStatusButton';
import { VerifyEducatorButton } from './VerifyEducatorButton';

export interface UserRowActionsProps {
  user: UserRowData;
  viewerUid: string;
  focusAfterRemovalId: string;
}

/** The three row controls of an account, or "You" on the admin's own row (no control at all). */
export function UserRowActions({ user, viewerUid, focusAfterRemovalId }: UserRowActionsProps) {
  const t = useTranslations('admin');
  const permissions = userRowPermissions(user, viewerUid);

  if (permissions.self) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Chip tone="brand">{t('shared.you')}</Chip>
        <p className="max-w-56 text-xs text-ink-muted">{t('shared.yourAccount')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <ChangeRoleButton user={user} focusAfterRemovalId={focusAfterRemovalId} />
      {permissions.verify !== null && (
        <VerifyEducatorButton
          uid={user.id}
          name={user.displayName}
          verified={permissions.verify === 'unverify'}
        />
      )}
      <UserStatusButton uid={user.id} name={user.displayName} status={user.status} />
    </div>
  );
}
