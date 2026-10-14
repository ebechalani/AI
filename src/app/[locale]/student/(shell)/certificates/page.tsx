// Stub (F8): WS-J replaces this page.
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { EmptyState } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';

export default async function StudentCertificatesPage() {
  await requireRole('student');
  const t = await getTranslations('nav');
  return (
    <>
      <PageHeader title={t('student.certificates')} />
      <EmptyState />
    </>
  );
}
