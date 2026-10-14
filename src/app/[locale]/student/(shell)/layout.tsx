import type { ReactNode } from 'react';
import { updateProfileAction } from '@/actions/settings';
import { AppShell } from '@/components/layout';
import { requireRole } from '@/lib/auth/session';
import { getUser } from '@/lib/data/users';

export default async function StudentShellLayout({ children }: { children: ReactNode }) {
  const session = await requireRole('student');
  // XP and level live on the profile, not in the session.
  const profile = await getUser(session, session.uid);
  return (
    <AppShell
      role="student"
      user={{
        displayName: session.displayName,
        avatarId: session.avatarId,
        xp: profile.xpTotal,
        level: profile.level,
      }}
      persistLocale={updateProfileAction}
    >
      {children}
    </AppShell>
  );
}
