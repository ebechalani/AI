import type { ReactNode } from 'react';
import { updateProfileAction } from '@/actions/settings';
import { AppShell } from '@/components/layout';
import { requireRole } from '@/lib/auth/session';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireRole('platform_admin');
  return (
    <AppShell
      role="platform_admin"
      user={{ displayName: session.displayName, avatarId: session.avatarId }}
      persistLocale={updateProfileAction}
    >
      {children}
    </AppShell>
  );
}
