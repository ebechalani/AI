import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/common';
import { FieldReveal } from './field-reveal';
import type { PersistLocale } from './LocaleSwitcher';
import { MobileNav } from './MobileNav';
import { SidebarNav } from './SidebarNav';
import { SkipLink } from './SkipLink';
import { TopBar, type ShellUser } from './TopBar';

export interface AppShellProps {
  role: Role;
  user: ShellUser;
  /**
   * `updateProfileAction` from src/actions/settings.ts, passed by the area layout so that the
   * language switcher saves the choice to the profile. Without it the page still changes
   * language; the preference is just not remembered.
   */
  persistLocale?: PersistLocale | null;
  children: ReactNode;
}

/**
 * The frame of every signed-in area: the role's navigation (a sidebar from `lg` up; below it a
 * bottom bar for students and a drawer for staff), the top bar, and the page in `<main>`.
 * It needs a ToastProvider above it (the locale layout has one).
 *
 * `data-app-shell` turns on the root scroll padding of globals.css while the shell is on screen
 * (ARCHITECTURE.md 7.5), so the browser scrolls a keyboard-focused element and a jump target
 * clear of the sticky TopBar and, for a student below `lg`, the fixed bottom bar (WCAG 2.2 SC
 * 2.4.11). For a text field the browser clears only its caret line; `FieldReveal` brings the rest
 * of a multi-line field out from under the bars. An element taller than the room between the
 * bars stays partly under one, never entirely.
 */
export function AppShell({ role, user, persistLocale, children }: AppShellProps) {
  return (
    <div data-app-shell={role} className="min-h-dvh bg-surface-muted">
      <SkipLink />
      <FieldReveal />
      <SidebarNav role={role} />
      <div className="flex min-h-dvh min-w-0 flex-col lg:ps-64">
        <TopBar role={role} user={user} persistLocale={persistLocale} />
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            'flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8',
            // Room for the student's bottom bar.
            role === 'student' && 'max-lg:pb-24',
          )}
        >
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
      {role === 'student' && <MobileNav role={role} />}
    </div>
  );
}
