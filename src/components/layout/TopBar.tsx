import { useTranslations } from 'next-intl';
import { XPBadge } from '@/components/domain/XPBadge';
import { Logo } from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';
import { roleHome } from '@/lib/navigation/nav-config';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/common';
import { LocaleSwitcher, type PersistLocale } from './LocaleSwitcher';
import { MobileNav } from './MobileNav';
import { SignOutButton } from './sign-out';
import { UserMenu } from './UserMenu';

export interface ShellUser {
  displayName: string;
  avatarId: string;
  /** Students only. */
  xp?: number;
  level?: number;
}

export interface TopBarProps {
  role: Role;
  user: ShellUser;
  /** `updateProfileAction`, so a language change is saved to the profile. */
  persistLocale?: PersistLocale | null;
}

export function TopBar({ role, user, persistLocale }: TopBarProps) {
  const t = useTranslations('nav');
  const isStudent = role === 'student';

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="flex min-h-16 items-center gap-1.5 px-4 sm:gap-3 sm:px-6 lg:px-8">
        {!isStudent && <MobileNav role={role} />}
        {/* From `lg` up the logo is in the sidebar. A student's phone gives the room to the
            name and the sign-out button instead. */}
        <Link
          href={roleHome(role)}
          aria-label={t('shell.homeLink')}
          className={cn('shrink-0 rounded-sm lg:hidden', isStudent && 'max-sm:hidden')}
        >
          <Logo variant="mark" label="" className="sm:hidden" />
          <Logo label="" height={28} className="max-sm:hidden" />
        </Link>
        <div className="flex-1" />
        {isStudent && user.xp !== undefined && user.level !== undefined && (
          <XPBadge xp={user.xp} level={user.level} size="sm" />
        )}
        {/* On a phone the language list must open towards the side that has room: a student's
            switcher sits mid-bar, a staff member's near the end. */}
        <LocaleSwitcher
          persist={persistLocale}
          align={isStudent ? 'start' : 'end'}
          compact={isStudent}
        />
        <UserMenu role={role} user={user} />
        {isStudent && <SignOutButton compact />}
      </div>
    </header>
  );
}
