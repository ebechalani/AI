import { Award } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CertificateCard } from '@/components/domain';
import { EmptyState } from '@/components/ui';
import type { Certificate } from '@/types/gamification';
import { SectionUnavailable } from './SectionUnavailable';

export interface RecentCertificatesProps {
  /** The latest certificates, revoked ones included; null when they could not be read. */
  certificates: readonly Certificate[] | null;
}

export function RecentCertificates({ certificates }: RecentCertificatesProps) {
  const t = useTranslations('student');

  if (certificates === null) return <SectionUnavailable />;
  if (certificates.length === 0) {
    return (
      <EmptyState
        icon={<Award />}
        title={t('certificates.empty.title')}
        description={t('certificates.empty.description')}
      />
    );
  }

  return (
    // Stacked in the side column (xl) and up to md; side by side while the page is one wide
    // column. Not from sm: a half-width card at 640-767 px splits the verification code.
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
      {certificates.map((certificate) => (
        <li key={certificate.id} className="min-w-0">
          <CertificateCard certificate={certificate} href={`/certificates/${certificate.id}`} />
        </li>
      ))}
    </ul>
  );
}
