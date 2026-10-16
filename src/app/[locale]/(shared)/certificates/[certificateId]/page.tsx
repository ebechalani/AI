import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import {
  CertificateActions,
  CertificateStatusNotice,
  certificateActions,
  certificateBackLink,
  certificateTitle,
  verifyUrl,
} from '@/components/certificates';
import { CertificateDocument } from '@/components/certificates/CertificateDocument';
import { requireRole } from '@/lib/auth/session';
import { getPublicEnv } from '@/lib/env';
import { loadCertificate } from './_components/load';

type Params = Promise<{ certificateId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { certificateId } = await params;
  const { certificate } = await loadCertificate(certificateId);
  const [t, locale] = await Promise.all([getTranslations('certificates'), getLocale()]);
  // Also the default file name of "Save as PDF".
  return { title: t('page.metaTitle', { course: certificateTitle(certificate, locale) }) };
}

// The printable certificate (ARCHITECTURE.md 6.1, 6.4, 9.5): any signed-in role; the service
// decides who may see it. The (shared) layout has no <main>: this page brings it.
export default async function CertificatePage({ params }: { params: Params }) {
  const session = await requireRole('student', 'teacher', 'school_admin', 'platform_admin');
  const { certificateId } = await params;
  const { certificate } = await loadCertificate(certificateId);
  const t = await getTranslations('certificates');
  const url = verifyUrl(getPublicEnv().appUrl, certificate.verificationCode);
  const { canRevoke, canReissue } = certificateActions(session, certificate);
  const back = certificateBackLink(session, certificate);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 outline-none sm:px-6 sm:py-8 print:max-w-none print:gap-0 print:p-0"
    >
      <CertificateActions
        certificateId={certificate.id}
        studentUid={certificate.userUid}
        courseId={certificate.courseId}
        status={certificate.status}
        verifyUrl={url}
        canRevoke={canRevoke}
        canReissue={canReissue}
        backHref={back.href}
        backLabel={t(`page.back.${back.key}`)}
      />
      <CertificateStatusNotice certificate={certificate} />
      <CertificateDocument certificate={certificate} verifyUrl={url} />
      {certificate.status === 'issued' && (
        <p className="text-sm text-ink-muted print:hidden">{t('page.printHint')}</p>
      )}
    </main>
  );
}
