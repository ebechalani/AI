import { useId, type ReactNode } from 'react';
import { describedBy } from '@/components/ui/control';
import { FieldMessages } from '@/components/ui/FormField';
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
