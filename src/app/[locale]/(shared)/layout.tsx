import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { updateProfileAction } from '@/actions/settings';
import { LocaleSwitcher, SignOutButton, SkipLink } from '@/components/layout';
import { Logo } from '@/components/ui';
import { roleHome } from '@/lib/auth/roles';
import { requireSession } from '@/lib/auth/session';
import { Link } from '@/lib/i18n/navigation';

/**
 * The printable certificate and the read-only lesson preview: any signed-in role, a one-line
 * bar that print hides, and no `<main>` of its own (the certificate page and `LessonShell`
 * each bring the `#main-content` landmark).
 */
export default async function SharedLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const t = await getTranslations('nav');
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <SkipLink />
      <header className="flex min-h-14 items-center gap-2 border-b border-border px-4 sm:px-6 print:hidden">
        <Link
          href={roleHome(session.role)}
          aria-label={t('shell.homeLink')}
          className="shrink-0 rounded-sm"
        >
          <Logo label="" height={28} />
        </Link>
        <div className="flex-1" />
        <LocaleSwitcher persist={updateProfileAction} />
        <SignOutButton compact />
      </header>
      {children}
    </div>
  );
}
