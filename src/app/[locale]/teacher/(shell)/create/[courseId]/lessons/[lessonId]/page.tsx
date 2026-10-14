// Stub (F8): WS-F replaces this page.
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { EmptyState } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';

export default async function TeacherLessonEditorPage() {
  await requireRole('teacher');
  const t = await getTranslations('nav');
  return (
    <>
      <PageHeader title={t('teacher.create')} />
      <EmptyState />
    </>
  );
}
