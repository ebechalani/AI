import { Award } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { certificateTitle } from '@/components/certificates/certificate-model';
import { StatusChip, useDateFormat } from '@/components/domain';
import { Card, EmptyState, LinkButton } from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';
import type { Certificate } from '@/types/gamification';
import { certificatePath, SCHOOL_PATHS } from './paths';

/** The latest certificates earned in the school: the dashboard's recent activity. */
export function RecentCertificates({ certificates }: { certificates: Certificate[] }) {
  const t = useTranslations('school');
  const locale = useLocale();
  const formatDate = useDateFormat();

  return (
    <Card as="section" aria-labelledby="recent-title" className="gap-4 p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 id="recent-title" className="text-lg leading-snug font-bold text-ink">
          {t('dashboard.recent.title')}
        </h2>
        <p className="text-sm text-ink-muted">{t('dashboard.recent.description')}</p>
      </div>
      {certificates.length === 0 ? (
        <EmptyState
          variant="plain"
          icon={<Award />}
          title={t('dashboard.recent.empty.title')}
          description={t('dashboard.recent.empty.description')}
        />
      ) : (
        <>
          <ul className="divide-y divide-border">
            {certificates.map((certificate) => (
              <li key={certificate.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                <Link
                  href={certificatePath(certificate.id)}
                  className="rounded-sm font-medium break-words text-ink underline-offset-4 hover:text-brand-700 hover:underline"
                >
                  {t('dashboard.recent.item', {
                    name: certificate.recipientName,
                    course: certificateTitle(certificate, locale),
                  })}
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                  <span>{formatDate(certificate.issuedAt)}</span>
                  {certificate.status === 'revoked' && <StatusChip status="revoked" size="sm" />}
                </div>
              </li>
            ))}
          </ul>
          <div>
            <LinkButton href={SCHOOL_PATHS.certificates} variant="ghost" size="sm">
              {t('dashboard.recent.viewAll')}
            </LinkButton>
          </div>
        </>
      )}
    </Card>
  );
}
