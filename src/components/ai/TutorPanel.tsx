'use client';

import type { ComponentType } from 'react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui';
import type { TutorMode } from '@/types/ai';

export interface TutorPanelProps {
  courseId?: string;
  lessonId?: string;
  defaultMode?: TutorMode;
  /** `panel` inside LessonShell's aside, `page` on /student/tutor. */
  variant: 'panel' | 'page';
}

// Stub (F8): WS-I fills it in; it receives a starter prompt only through useTutorBridge()
// (ARCHITECTURE.md 7.5, 7.7).
export const TutorPanel: ComponentType<TutorPanelProps> = function TutorPanel() {
  const t = useTranslations('errors');
  return <EmptyState variant="plain" title={t('not_implemented')} />;
};
