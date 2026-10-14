'use client';

import { useTranslations } from 'next-intl';
import { NamedIcon } from '@/components/domain/NamedIcon';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { isNavItemActive, type NavItem } from '@/lib/navigation/nav-config';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/common';

export interface NavLinksProps {
  role: Role;
  items: readonly NavItem[];
  /** Called when a link is followed, so a drawer can close itself. */
  onNavigate?: () => void;
  className?: string;
}

/** A vertical list of navigation links with the current section marked. */
export function NavLinks({ role, items, onNavigate, className }: NavLinksProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <ul className={cn('flex flex-col gap-1', className)}>
      {items.map((item) => {
        const active = isNavItemActive(pathname, item, role);
        return (
          <li key={item.key}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              onClick={onNavigate}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors focus-visible:-outline-offset-2',
                active
                  ? 'bg-brand-50 font-semibold text-brand-800'
                  : 'font-medium text-ink-muted hover:bg-surface-muted hover:text-ink',
              )}
            >
              <NamedIcon
                name={item.icon}
                className={cn('size-5 shrink-0', active && 'text-brand-600')}
              />
              <span className="min-w-0 flex-1 truncate">{t(`${role}.${item.key}`)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
