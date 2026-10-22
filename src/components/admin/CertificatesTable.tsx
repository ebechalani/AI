import { useLocale, useTranslations } from 'next-intl';
import { IssueCertificateButton } from '@/components/certificates/IssueCertificateButton';
import { CertifiedBadge, StatusChip, useDateFormat } from '@/components/domain';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui';
import { pickTranslation } from '@/lib/i18n/content';
import { Link } from '@/lib/i18n/navigation';
import type { Certificate } from '@/types/gamification';
import { userCertificatesPath } from './paths';
import { RevokeCertificateButton } from './RevokeCertificateButton';

export interface CertificatesTableProps {
  certificates: Certificate[];
  /** The learner column (the whole platform's list); off on one learner's page. */
  showLearner: boolean;
  /** Where the focus goes after a revocation removes the Revoke button. */
  focusAfterId: string;
}

const LINK_CLASSES =
  'rounded-sm font-medium break-words text-ink underline-offset-4 hover:text-brand-700 hover:underline';

/** Certificates with their learner, course, school, dates, state, a view / issue-again control and Revoke. */
export function CertificatesTable({ certificates, showLearner, focusAfterId }: CertificatesTableProps) {
  const t = useTranslations('admin');
  const locale = useLocale();
  const formatDate = useDateFormat();

  return (
    <Table caption={t('certificates.caption')}>
      <TableHead>
        <TableRow>
          {showLearner && <TableHeaderCell>{t('certificates.columns.learner')}</TableHeaderCell>}
          <TableHeaderCell>{t('certificates.columns.course')}</TableHeaderCell>
          <TableHeaderCell>{t('certificates.columns.school')}</TableHeaderCell>
          <TableHeaderCell>{t('certificates.columns.issued')}</TableHeaderCell>
          <TableHeaderCell>{t('certificates.columns.issuer')}</TableHeaderCell>
          <TableHeaderCell>{t('certificates.columns.status')}</TableHeaderCell>
          <TableHeaderCell align="end">{t('certificates.columns.actions')}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {certificates.map((certificate) => {
          const title = pickTranslation(certificate.courseTitle, locale, 'en').title;
          const course = (
            <>
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium break-words text-ink">{title}</span>
                {certificate.isOfficial && <CertifiedBadge size="sm" />}
              </span>
              <span translate="no" className="block font-mono text-xs text-ink-muted">
                {t('certificates.code', { code: certificate.verificationCode })}
              </span>
            </>
          );
          return (
            <TableRow key={certificate.id}>
              {showLearner ? (
                <TableHeaderCell scope="row" wrap className="min-w-48 font-normal">
                  <Link href={userCertificatesPath(certificate.userUid)} className={LINK_CLASSES}>
                    {certificate.recipientName}
                  </Link>
                </TableHeaderCell>
              ) : null}
              {showLearner ? (
                <TableCell className="min-w-48">{course}</TableCell>
              ) : (
                <TableHeaderCell scope="row" wrap className="min-w-48 font-normal">
                  {course}
                </TableHeaderCell>
              )}
              <TableCell>
                {certificate.schoolName ?? (
                  <span className="text-ink-muted">{t('certificates.independent')}</span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap">{formatDate(certificate.issuedAt)}</TableCell>
              <TableCell>{certificate.issuerName}</TableCell>
              <TableCell className="min-w-32">
                <StatusChip status={certificate.status} />
                {certificate.status === 'revoked' && (
                  <>
                    {certificate.revokedAt !== null && (
                      <span className="mt-1 block text-xs text-ink">
                        {t('certificates.revokedOn', { date: formatDate(certificate.revokedAt) })}
                      </span>
                    )}
                    {certificate.revokedReason !== null && (
                      <span className="block text-xs break-words text-ink-muted">
                        {certificate.revokedReason}
                      </span>
                    )}
                  </>
                )}
              </TableCell>
              <TableCell align="end">
                <div className="flex flex-wrap justify-end gap-2">
                  <IssueCertificateButton
                    studentUid={certificate.userUid}
                    courseId={certificate.courseId}
                    existingCertificateId={certificate.status === 'issued' ? certificate.id : null}
                  />
                  {certificate.status === 'issued' && (
                    <RevokeCertificateButton
                      certificateId={certificate.id}
                      learnerName={certificate.recipientName}
                      courseTitle={title}
                      focusAfterId={focusAfterId}
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
