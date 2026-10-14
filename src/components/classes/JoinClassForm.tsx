'use client';

import type { ComponentType } from 'react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui';

export interface JoinClassFormProps {
  /** Locale-less path to load after a successful join; defaults to the student home. */
  redirectTo?: string;
}

// Stub (F8): WS-E fills it in (ARCHITECTURE.md 7.7).
export const JoinClassForm: ComponentType<JoinClassFormProps> = function JoinClassForm() {
  const t = useTranslations('errors');
  return <EmptyState variant="plain" title={t('not_implemented')} />;
};
