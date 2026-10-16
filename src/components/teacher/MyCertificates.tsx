import { Award } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CertificateCard } from '@/components/domain';
import { EmptyState, LinkButton } from '@/components/ui';
import type { Certificate } from '@/types/gamification';
import { certificatePath, coursesPath } from './paths';

export interface MyCertificatesProps {
  /** Newest first, revoked ones included (the card shows the status). */
  certificates: Certificate[];
}

export function MyCertificates({ certificates }: MyCertificatesProps) {
  const t = useTranslations('teacher');
  return (
    <section aria-labelledby="my-certificates-title" className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="my-certificates-title" className="text-xl font-bold text-ink">
          {t('settings.certificates.title')}
        </h2>
        <p className="text-sm text-ink-muted">{t('settings.certificates.description')}</p>
      </div>
      {certificates.length === 0 ? (
        <EmptyState
          icon={<Award />}
          title={t('settings.certificates.empty.title')}
          description={t('settings.certificates.empty.description')}
          action={
            <LinkButton href={coursesPath('academy')} variant="secondary">
              {t('settings.certificates.empty.action')}
            </LinkButton>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {certificates.map((certificate) => (
            <CertificateCard
              key={certificate.id}
              certificate={certificate}
              href={certificatePath(certificate.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
