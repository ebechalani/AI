'use client';

import type { ComponentType } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';

export interface IssueCertificateButtonProps {
  studentUid: string;
  courseId: string;
  /** When set, the button offers re-issue instead of a first issue. */
  existingCertificateId: string | null;
}

// Stub (F8): WS-J fills it in (ARCHITECTURE.md 7.7).
export const IssueCertificateButton: ComponentType<IssueCertificateButtonProps> =
  function IssueCertificateButton() {
    const t = useTranslations('errors');
    return (
      <Button variant="secondary" size="sm" disabled>
        {t('not_implemented')}
      </Button>
    );
  };
