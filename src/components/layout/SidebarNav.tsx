import { useTranslations } from 'next-intl';
import { Logo } from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';
import { NAV_ITEMS, roleHome } from '@/lib/navigation/nav-config';
import type { Role } from '@/types/common';
import { NavLinks } from './NavLinks';

/** The desktop navigation: a fixed column on the inline-start side, from `lg` up. */
export function SidebarNav({ role }: { role: Role }) {
  const t = useTranslations('nav');
  return (
    <div className="fixed inset-y-0 inset-s-0 z-30 hidden w-64 flex-col border-e border-border bg-surface lg:flex">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link href={roleHome(role)} aria-label={t('shell.homeLink')} className="rounded-sm">
          <Logo label="" height={30} />
        </Link>
      </div>
      <nav aria-label={t('shell.mainNavigation')} className="min-h-0 flex-1 overflow-y-auto p-3">
        <NavLinks role={role} items={NAV_ITEMS[role]} />
      </nav>
    </div>
  );
}
