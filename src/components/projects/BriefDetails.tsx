import { ChevronDown } from 'lucide-react';
import type { SubmissionType } from '@/types/common';
import { ProjectBrief } from './ProjectBrief';

export interface BriefDetailsProps {
  /** The summary's h2, already translated. */
  title: string;
  /** null when the project or challenge is no longer available. */
  text: { brief: string; requirements: string } | null;
  allowedTypes: SubmissionType[] | null;
  /** Shown instead of the brief when `text` is null, already translated. */
  unavailable: string;
}

/**
 * What the work answered, folded away on the detail pages. The summary holds an h2, so the
 * brief's h3 headings sit under it in the outline.
 */
export function BriefDetails({ title, text, allowedTypes, unavailable }: BriefDetailsProps) {
  return (
    <details className="group min-w-0 rounded-card border border-border bg-surface shadow-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-card px-5 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <ChevronDown
          aria-hidden="true"
          className="size-5 shrink-0 text-ink-muted transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-border px-5 py-5 sm:px-6">
        {text === null ? (
          <p className="text-ink-muted">{unavailable}</p>
        ) : (
          <ProjectBrief text={text} allowedTypes={allowedTypes} headingLevel="h3" />
        )}
      </div>
    </details>
  );
}
