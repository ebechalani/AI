'use client';

import type { ComponentType } from 'react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui';
import type { SubmissionType } from '@/types/common';
import type { SubmissionTarget } from '@/types/project';

export interface SubmissionFormProps {
  target: SubmissionTarget;
  allowedTypes: SubmissionType[];
  /** The returned submission this one resubmits. */
  previousSubmissionId?: string | null;
}

// Stub (F8): WS-D fills it in (ARCHITECTURE.md 7.7).
export const SubmissionForm: ComponentType<SubmissionFormProps> = function SubmissionForm() {
  const t = useTranslations('errors');
  return <EmptyState variant="plain" title={t('not_implemented')} />;
};
