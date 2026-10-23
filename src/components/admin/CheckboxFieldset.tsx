import { useId, type ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxFieldsetProps {
  legend: ReactNode;
  hint?: ReactNode;
  /** An already translated message; the caller marks its first checkbox `invalid` with it. */
  error?: ReactNode;
  disabled?: boolean;
  /** The layout of the checkboxes (`grid grid-cols-2 sm:grid-cols-4`); a column by default. */
  gridClassName?: string;
  className?: string;
  children: ReactNode;
}

/** A group of checkboxes with a legend, a hint and an error, bound the way `FormField` binds them. */
export function CheckboxFieldset({
  legend,
  hint,
  error,
  disabled,
  gridClassName,
  className,
  children,
}: CheckboxFieldsetProps) {
  const groupId = useId();
  const hintId = `${groupId}-hint`;
  const errorId = `${groupId}-error`;
  return (
    <fieldset
      disabled={disabled}
      aria-describedby={describedBy(hint && hintId, error && errorId)}
      className={cn('min-w-0', className)}
    >
      <legend className="mb-2 text-sm font-semibold text-ink">{legend}</legend>
      <div className={cn(gridClassName ?? 'flex flex-col', 'gap-3')}>{children}</div>
      <FieldMessages hint={hint} hintId={hintId} error={error} errorId={errorId} />
    </fieldset>
  );
}

// Local copies of two small helpers of the UI kit's `FormField`. The kit's public surface is
// `components/ui/index.ts` (ARCHITECTURE.md 7.3), which does not export them; these render the
// hint and the error exactly as `FormField` does.

/** Joins the ids the group is described by; empty or missing ids are skipped. */
function describedBy(...ids: unknown[]): string | undefined {
  return ids.filter((id) => typeof id === 'string' && id !== '').join(' ') || undefined;
}

function FieldMessages({
  hint,
  hintId,
  error,
  errorId,
}: {
  hint?: ReactNode;
  hintId: string;
  error?: ReactNode;
  errorId: string;
}) {
  return (
    <>
      {hint && (
        <p id={hintId} className="mt-1.5 text-sm text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-danger">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </>
  );
}
