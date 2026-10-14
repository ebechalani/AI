import type { ReactNode } from 'react';
import { requireRole } from '@/lib/auth/session';

// The shell lives in (shell)/layout.tsx so that the lesson player under (player) can take the
// whole viewport; this layout only guards the area.
export default async function TeacherLayout({ children }: { children: ReactNode }) {
  await requireRole('teacher');
  return children;
}
