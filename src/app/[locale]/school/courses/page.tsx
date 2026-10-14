// Stub (F8): WS-G replaces this page.
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { EmptyState } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';

export default async function SchoolCoursesPage() {
  await requireRole('school_admin');
  const t = await getTranslations('nav');
  return (
    <>
      <PageHeader title={t('school_admin.courses')} />
      <EmptyState />
    </>
  );
}
