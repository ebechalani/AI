// Stub (F8): WS-H replaces this page.
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { EmptyState } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';

export default async function AdminCertificatesPage() {
  await requireRole('platform_admin');
  const t = await getTranslations('nav');
  return (
    <>
      <PageHeader title={t('platform_admin.certificates')} />
      <EmptyState />
    </>
  );
}
