'use client';

import type { SubmissionType } from '@/types/common';
import type { SubmissionTarget } from '@/types/project';
import { SubmissionEditor } from './SubmissionEditor';

export interface SubmissionFormProps {
  target: SubmissionTarget;
  allowedTypes: SubmissionType[];
  /** The returned submission this one resubmits. */
  previousSubmissionId?: string | null;
}

/**
 * The submission form of ARCHITECTURE.md 7.7, for other workstreams (a challenge page): it
 * starts empty. On success it shows a toast and refreshes the page; it handles its own errors.
 */
export function SubmissionForm(props: SubmissionFormProps) {
  return <SubmissionEditor {...props} seed={null} />;
}
