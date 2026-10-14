'use client';

import { useCallback, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { signOutAction } from '@/actions/session';
import { Button, useToast, type ButtonProps } from '@/components/ui';
import { getPathname } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';

/**
 * One call signs the user out everywhere: the server ends the session and clears the cookie,
 * then the browser loads the login page. A full page load, not a client navigation, so nothing
 * of the previous user (router cache, tutor conversation, Firebase client state) stays in
 * memory on a shared classroom computer.
 */
export function useSignOut(): { signOut: () => void; pending: boolean } {
  const locale = useLocale();
  const t = useTranslations('errors');
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const running = useRef(false);

  const signOut = useCallback(() => {
    if (running.current) return;
    running.current = true;
    setPending(true);

    // The Firebase client user is in memory only and goes with the page; this is best effort
    // and must not delay or fail the real sign-out.
    void import('@/lib/auth/client').then((client) => client.signOutClient()).catch(() => {});

    signOutAction()
      .then((result) => {
        if (result.ok) {
          window.location.assign(getPathname({ href: '/login', locale }));
          return;
        }
        toast({ tone: 'danger', title: t(result.error.code) });
        running.current = false;
        setPending(false);
      })
      .catch(() => {
        toast({ tone: 'danger', title: t('offline') });
        running.current = false;
        setPending(false);
      });
  }, [locale, t, toast]);

  return { signOut, pending };
}

export interface SignOutButtonProps extends Pick<ButtonProps, 'variant' | 'size' | 'className'> {
  /** Hides the text below `sm`, leaving the icon: for the top bar on a phone. */
  compact?: boolean;
}

/** A visible, one-click sign-out. */
export function SignOutButton({
  variant = 'secondary',
  size = 'sm',
  compact = false,
  className,
}: SignOutButtonProps) {
  const t = useTranslations('nav');
  const { signOut, pending } = useSignOut();
  return (
    <Button
      variant={variant}
      size={size}
      loading={pending}
      onClick={signOut}
      aria-label={compact ? t('shell.signOut') : undefined}
      className={cn('shrink-0', className)}
    >
      {!pending && <LogOut aria-hidden="true" className="rtl:-scale-x-100" />}
      <span className={cn(compact && 'max-sm:hidden')}>{t('shell.signOut')}</span>
    </Button>
  );
}
