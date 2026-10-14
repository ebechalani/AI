import type { ReactNode } from 'react';
import { updateProfileAction } from '@/actions/settings';
import { AppShell } from '@/components/layout';
import { requireRole } from '@/lib/auth/session';

export default async function TeacherShellLayout({ children }: { children: ReactNode }) {
  const session = await requireRole('teacher');
  return (
    <AppShell
      role="teacher"
      user={{ displayName: session.displayName, avatarId: session.avatarId }}
      persistLocale={updateProfileAction}
    >
      {children}
    </AppShell>
  );
}
