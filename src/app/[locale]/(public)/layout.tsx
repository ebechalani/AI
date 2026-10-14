import type { ReactNode } from 'react';
import { PublicShell } from '@/components/layout';
import { roleHome } from '@/lib/auth/roles';
import { getSession } from '@/lib/auth/session';

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  return (
    <PublicShell mySpaceHref={session === null ? null : roleHome(session.role)}>
      {children}
    </PublicShell>
  );
}
