'use client';

import { useState } from 'react';
import { Ellipsis, Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { NamedIcon } from '@/components/domain/NamedIcon';
import { IconButton, Logo } from '@/components/ui';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { isNavItemActive, NAV_ITEMS, PROFILE_ITEMS } from '@/lib/navigation/nav-config';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/common';
import { Drawer } from './Drawer';
import { NavLinks } from './NavLinks';

// A phone fits five targets side by side: four sections and "More".
const BAR_ITEMS = 4;

const TAB =
  'flex min-h-14 w-full min-w-0 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[0.6875rem] leading-tight font-semibold transition-colors focus-visible:-outline-offset-2';
const TAB_IDLE = 'text-ink-muted hover:text-ink';
const TAB_ACTIVE = 'text-brand-700';

/** Students: a bar along the bottom with the first sections; the rest opens from "More". */
function BottomBar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const barItems = NAV_ITEMS.student.slice(0, BAR_ITEMS);
  const moreItems = [...NAV_ITEMS.student.slice(BAR_ITEMS), ...PROFILE_ITEMS.student];
  const moreActive = moreItems.some((item) => isNavItemActive(pathname, item, 'student'));
  const close = () => setMoreOpen(false);

  return (
    <>
      <nav
        aria-label={t('shell.mainNavigation')}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {barItems.map((item) => {
            const active = isNavItemActive(pathname, item, 'student');
            return (
              <li key={item.key} className="min-w-0">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(TAB, active ? TAB_ACTIVE : TAB_IDLE)}
                >
                  <NamedIcon name={item.icon} className="size-6 shrink-0" />
                  <span className="max-w-full truncate">{t(`student.${item.key}`)}</span>
                </Link>
              </li>
            );
          })}
          <li className="min-w-0">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen(true)}
              className={cn(TAB, moreActive ? TAB_ACTIVE : TAB_IDLE)}
            >
              <Ellipsis aria-hidden="true" className="size-6 shrink-0" />
              <span className="max-w-full truncate">{t('shell.more')}</span>
            </button>
          </li>
        </ul>
      </nav>
      <Drawer
        open={moreOpen}
        onClose={close}
        side="bottom"
        label={t('shell.more')}
        closeLabel={t('shell.closeMenu')}
        header={<p className="text-base font-semibold text-ink">{t('shell.more')}</p>}
      >
        <nav
          aria-label={t('shell.more')}
          className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <NavLinks role="student" items={moreItems} onNavigate={close} />
        </nav>
      </Drawer>
    </>
  );
}

/** Staff: a menu button for the top bar; the whole navigation slides in from the side. */
function DrawerNav({ role }: { role: Role }) {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const profileItems = PROFILE_ITEMS[role];

  return (
    <>
      <IconButton
        aria-label={t('shell.openMenu')}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="-ms-2 lg:hidden"
      >
        <Menu />
      </IconButton>
      <Drawer
        open={open}
        onClose={close}
        label={t('shell.mainNavigation')}
        closeLabel={t('shell.closeMenu')}
        header={<Logo height={28} />}
      >
        <nav aria-label={t('shell.mainNavigation')} className="p-3">
          <NavLinks role={role} items={NAV_ITEMS[role]} onNavigate={close} />
          {profileItems.length > 0 && (
            <NavLinks
              role={role}
              items={profileItems}
              onNavigate={close}
              className="mt-3 border-t border-border pt-3"
            />
          )}
        </nav>
      </Drawer>
    </>
  );
}

/** The navigation below `lg`: a bottom bar for students, a drawer for everyone else. */
export function MobileNav({ role }: { role: Role }) {
  return role === 'student' ? <BottomBar /> : <DrawerNav role={role} />;
}
