import { cloneElement, useId, type ReactElement, type ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { describedBy } from './control';
import { Label } from './Label';

/** What a field hands to its control so the label, hint and error are bound to it. */
export interface FieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  required?: boolean;
}

export interface FormFieldProps {
  label: ReactNode;
  /** Help text under the control; stays visible next to an error. */
  hint?: ReactNode;
  /** An already translated message. Its presence marks the control invalid. */
  error?: ReactNode;
  required?: boolean;
  optional?: boolean;
  hideLabel?: boolean;
  /** Overrides the generated control id. */
  id?: string;
  className?: string;
  /**
   * One control element (`Input`, `Textarea`, `Select`, or anything that accepts
   * `FieldControlProps`), which receives them, or a function that places them itself.
   */
  children: ReactElement<Partial<FieldControlProps>> | ((control: FieldControlProps) => ReactNode);
}

export function FieldMessages({
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

export function FormField({
  label,
  hint,
  error,
  required,
  optional,
  hideLabel = false,
  id,
  className,
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const own = typeof children === 'function' ? undefined : children.props;
  const controlId = id ?? own?.id ?? generatedId;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const description = describedBy(own?.['aria-describedby'], error && errorId, hint && hintId);

  // Only the keys that apply: cloneElement would overwrite the control's own prop with an
  // explicit undefined.
  const control: FieldControlProps = {
    id: controlId,
    ...(description && { 'aria-describedby': description }),
    ...(error ? { 'aria-invalid': true as const } : null),
    ...(required && { required: true }),
  };

  return (
    <div className={cn('min-w-0', className)}>
      <Label
        htmlFor={controlId}
        required={required}
        optional={optional}
        className={cn(hideLabel ? 'sr-only' : 'mb-1.5')}
      >
        {label}
      </Label>
      {typeof children === 'function' ? children(control) : cloneElement(children, control)}
      <FieldMessages hint={hint} hintId={hintId} error={error} errorId={errorId} />
    </div>
  );
}
