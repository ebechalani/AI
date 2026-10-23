import { useLocale, useTranslations } from 'next-intl';
import { certificateTitle } from '@/components/certificates/certificate-model';
import { CertifiedBadge, StatusChip, useDateFormat } from '@/components/domain';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';
import type { Certificate } from '@/types/gamification';
import { certificatePath } from './paths';

/** The certificates of the school, latest first, each opening the printable certificate. */
export function SchoolCertificatesTable({ certificates }: { certificates: Certificate[] }) {
  const t = useTranslations('school');
  const locale = useLocale();
  const formatDate = useDateFormat();

  return (
    <Table caption={t('certificates.caption')}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t('certificates.learner')}</TableHeaderCell>
          <TableHeaderCell>{t('certificates.course')}</TableHeaderCell>
          <TableHeaderCell>{t('certificates.issued')}</TableHeaderCell>
          <TableHeaderCell>{t('certificates.issuedBy')}</TableHeaderCell>
          <TableHeaderCell>{t('certificates.status')}</TableHeaderCell>
          <TableHeaderCell>{t('certificates.code')}</TableHeaderCell>
          {/* `relative`: the sr-only text is absolutely positioned; anchored to this cell it stays
              inside the scroll region instead of widening the page at 375 px. */}
          <TableHeaderCell align="end" className="relative">
            <span className="sr-only">{t('certificates.view')}</span>
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {certificates.map((certificate) => {
          const course = certificateTitle(certificate, locale);
          return (
            <TableRow key={certificate.id}>
              <TableHeaderCell scope="row" wrap className="min-w-36 font-medium break-words">
                {certificate.recipientName}
              </TableHeaderCell>
              <TableCell className="min-w-48">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 break-words">{course}</span>
                  {certificate.isOfficial && <CertifiedBadge size="sm" />}
                </span>
              </TableCell>
              <TableCell className="whitespace-nowrap">{formatDate(certificate.issuedAt)}</TableCell>
              <TableCell className="min-w-32 break-words">{certificate.issuerName}</TableCell>
              <TableCell>
                <StatusChip status={certificate.status} />
              </TableCell>
              <TableCell translate="no" className="font-mono whitespace-nowrap">
                {certificate.verificationCode}
              </TableCell>
              <TableCell align="end">
                <Link
                  href={certificatePath(certificate.id)}
                  aria-label={t('certificates.viewLabel', {
                    name: certificate.recipientName,
                    course,
                  })}
                  className="rounded-sm font-medium text-brand-700 underline underline-offset-4 hover:text-brand-800"
                >
                  {t('certificates.view')}
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
