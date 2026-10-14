import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Logo } from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';
import { LocaleSwitcher } from './LocaleSwitcher';

/** Log in, sign up and their neighbours: one centered card on the brand gradient. */
export function AuthShell({ children }: { children: ReactNode }) {
  const t = useTranslations('nav');
  return (
    <div className="flex min-h-dvh flex-col bg-linear-to-br from-brand-100 via-surface to-accent-100">
      <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-5">
        <Link href="/" aria-label={t('shell.homeLink')} className="rounded-sm">
          <Logo label="" />
        </Link>
        <LocaleSwitcher />
      </header>
      <main
        id="main-content"
        className="flex flex-1 items-start justify-center px-4 pt-4 pb-12 sm:items-center sm:pt-0 sm:pb-20"
      >
        <Card className="w-full max-w-md p-6 sm:p-8">{children}</Card>
      </main>
    </div>
  );
}
