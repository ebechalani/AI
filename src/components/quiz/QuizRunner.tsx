'use client';

import type { ComponentType } from 'react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui';
import type { Quiz, QuizAttempt } from '@/types/quiz';

export interface QuizRunnerProps {
  courseId: string;
  quiz: Quiz;
  /** The student projection of ARCHITECTURE.md 3.4: no results. */
  latestAttempt: QuizAttempt | null;
  /** null = unlimited. */
  attemptsRemaining: number | null;
  readOnly: boolean;
}

// Stub (F8): WS-C fills it in (ARCHITECTURE.md 7.6, 7.7).
export const QuizRunner: ComponentType<QuizRunnerProps> = function QuizRunner() {
  const t = useTranslations('errors');
  return <EmptyState variant="plain" title={t('not_implemented')} />;
};
