import type { Metadata } from 'next';
import { Award } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { CertificateCard } from '@/components/domain';
import { PageHeader } from '@/components/layout';
import { EmptyState, LinkButton } from '@/components/ui';
import { requireRole } from '@/lib/auth/session';
import { listCertificatesForUser } from '@/lib/data/certificates';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('student.certificates') };
}

// The student's certificates (ARCHITECTURE.md 6.4, 3.7 "Certificates (student)"), newest first;
// a revoked one stays in the list and its card says so.
export default async function StudentCertificatesPage() {
  const session = await requireRole('student');
  const [certificates, t, tNav] = await Promise.all([
    listCertificatesForUser(session, session.uid),
    getTranslations('certificates'),
    getTranslations('nav'),
  ]);

  return (
    <>
      <PageHeader title={tNav('student.certificates')} description={t('list.description')} />
      {certificates.length === 0 ? (
        <EmptyState
          icon={<Award />}
          titleAs="h2"
          title={t('list.empty.title')}
          description={t('list.empty.description')}
          action={<LinkButton href="/student/learn">{t('list.empty.action')}</LinkButton>}
        />
      ) : (
        // The cards' titles are h3: the list needs an h2 above them.
        <section aria-labelledby="certificates-list">
          <h2 id="certificates-list" className="sr-only">
            {t('list.heading')}
          </h2>
          <p className="mb-4 text-sm text-ink-muted">
            {t('list.count', { count: certificates.length })}
          </p>
          {/* Two columns from md, three only from 2xl: a card narrower than ~330 px moves the
              verification code to its own line. */}
          <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {certificates.map((certificate) => (
              <li key={certificate.id} className="min-w-0">
                <CertificateCard
                  certificate={certificate}
                  href={`/certificates/${certificate.id}`}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
