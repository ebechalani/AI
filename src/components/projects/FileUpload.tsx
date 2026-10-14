'use client';

import type { ComponentType } from 'react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui';
import type { FileKind, FilePurpose, FileRef, MediaRef } from '@/types/common';

export interface FileUploadProps {
  purpose: FilePurpose;
  kinds: FileKind[];
  /** For `course_media`: the course the media belongs to; null = official media without a course. */
  courseId?: string | null;
  official?: boolean;
  /** Called once the file is registered (uploadFile() then registerUploadAction). */
  onUploaded: (result: { file: FileRef; media: MediaRef | null }) => void;
}

// Stub (F8): WS-D fills it in; the one upload control of the app (ARCHITECTURE.md 7.7).
export const FileUpload: ComponentType<FileUploadProps> = function FileUpload() {
  const t = useTranslations('errors');
  return <EmptyState variant="plain" title={t('not_implemented')} />;
};
