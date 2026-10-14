import type { ReactNode } from 'react';
import { PublicFooter } from './PublicFooter';
import { PublicHeader, type PublicHeaderProps } from './PublicHeader';
import { SkipLink } from './SkipLink';

export interface PublicShellProps extends PublicHeaderProps {
  children: ReactNode;
}

/** The frame of the marketing pages. Sections inside `children` set their own width. */
export function PublicShell({ children, mySpaceHref }: PublicShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <PublicHeader mySpaceHref={mySpaceHref} />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
