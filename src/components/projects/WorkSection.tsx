import type { Submission } from '@/types/project';
import { AttachmentList } from './AttachmentList';
import { RefocusHeading } from './RefocusHeading';
import { WorkView } from './WorkView';

export interface WorkSectionProps {
  submission: Submission;
  /** The section's h2, already translated ("Your work", "The student’s work"). */
  title: string;
  canDelete: boolean;
  /** A line under the files, already translated (the owner's "until reviewed" hint). */
  hint?: string | null;
}

/**
 * What was sent and its files, on both detail pages. Its heading takes focus back when the last
 * file is deleted and the attachments heading, which would have taken it, is gone.
 */
export function WorkSection({ submission, title, canDelete, hint }: WorkSectionProps) {
  const hasFiles = submission.attachments.length > 0;
  return (
    <section aria-labelledby="submission-work" className="flex min-w-0 flex-col gap-5">
      <RefocusHeading
        as="h2"
        id="submission-work"
        focusKey={hasFiles ? 'files' : 'none'}
        className="text-xl font-bold text-ink"
      >
        {title}
      </RefocusHeading>
      <WorkView submission={submission} headingLevel="h3" />
      <AttachmentList
        submissionId={submission.id}
        attachments={submission.attachments}
        canDelete={canDelete}
        headingLevel="h3"
      />
      {hasFiles && hint && <p className="text-sm text-ink-muted">{hint}</p>}
    </section>
  );
}
