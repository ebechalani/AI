// Stub (F8): WS-C replaces this page.
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { EmptyState } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';

export default async function TeacherAttemptPage() {
  await requireRole('teacher');
  const t = await getTranslations('nav');
  return (
    <>
      <PageHeader title={t('teacher.assessments')} />
      <EmptyState />
    </>
  );
}
