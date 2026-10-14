import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/layout';
import { EmptyState } from '@/components/ui';
import { requireSession } from '@/lib/auth/session';

// Any signed-in role may land here; canViewCertificate decides per certificate (WS-J).
export default async function CertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  await requireSession();
  await params;
  const t = await getTranslations('nav');

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader title={t('pages.certificate')} />
      <EmptyState />
    </main>
  );
}
