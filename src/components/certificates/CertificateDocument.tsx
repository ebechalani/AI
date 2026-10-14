import type { ComponentType } from 'react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui';
import type { Certificate } from '@/types/gamification';

export interface CertificateDocumentProps {
  certificate: Certificate;
  /** The absolute URL of the public verification page, printed on the document. */
  verifyUrl: string;
}

// Stub (F8): WS-J fills it in (ARCHITECTURE.md 7.7).
export const CertificateDocument: ComponentType<CertificateDocumentProps> =
  function CertificateDocument() {
    const t = useTranslations('errors');
    return <EmptyState variant="plain" title={t('not_implemented')} />;
  };
