'use client';

import { ChevronDown, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { NamedIcon } from '@/components/domain/NamedIcon';
import { Avatar, DropdownMenu, type DropdownMenuItem } from '@/components/ui';
import { PROFILE_ITEMS } from '@/lib/navigation/nav-config';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/common';
import { useSignOut } from './sign-out';

export interface UserMenuProps {
  role: Role;
  user: { displayName: string; avatarId: string };
}

/** The avatar menu of the top bar: who is signed in, the profile pages of the role, sign out. */
export function UserMenu({ role, user }: UserMenuProps) {
  const t = useTranslations('nav');
  const { signOut } = useSignOut();

  const items: DropdownMenuItem[] = [
    { type: 'heading', label: t('shell.signedInAs', { name: user.displayName }) },
    ...PROFILE_ITEMS[role].map((item): DropdownMenuItem => ({
      label: t(`${role}.${item.key}`),
      href: item.href,
      icon: <NamedIcon name={item.icon} />,
    })),
    { type: 'separator' },
    {
      label: t('shell.signOut'),
      icon: <LogOut aria-hidden="true" className="rtl:-scale-x-100" />,
      onSelect: signOut,
    },
  ];

  return (
    <DropdownMenu
      items={items}
      className="min-w-0"
      triggerClassName="inline-flex min-h-11 max-w-full min-w-0 items-center gap-2 rounded-full py-1 ps-1 pe-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted aria-expanded:bg-surface-muted"
      trigger={
        <>
          <Avatar avatarId={user.avatarId} size="sm" />
          <span className="sr-only">{t('shell.userMenu')}: </span>
          {/* A student's name is always on screen (shared classroom computers); staff names
              give way to the page on a phone. */}
          <span className={cn('min-w-0 truncate', role !== 'student' && 'max-md:hidden')}>
            {user.displayName}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn('size-4 shrink-0 text-ink-muted', role === 'student' && 'max-sm:hidden')}
          />
        </>
      }
    />
  );
}
