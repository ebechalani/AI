import { NamedIcon } from '@/components/domain';

export interface LabMockPreviewProps {
  /** The tool's lucide icon name. */
  icon: string;
  /** The chosen option, already translated. */
  caption: string;
}

/**
 * A decorative stand-in for a demo tool's output (a picture, a clip, a voice): hidden from
 * assistive technology, since the result card states the prompt, the choice and the demo text.
 */
export function LabMockPreview({ icon, caption }: LabMockPreviewProps) {
  return (
    <div
      aria-hidden="true"
      className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-control bg-linear-to-br from-brand-100 to-accent-100 p-4 text-center text-brand-700"
    >
      <NamedIcon name={icon} className="size-12" />
      <span className="max-w-full text-sm font-semibold break-words">{caption}</span>
    </div>
  );
}
