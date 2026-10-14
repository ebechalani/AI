import { useId, type ComponentProps, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CHOICE_DESCRIPTION_CLASSES, CHOICE_LABEL_CLASSES, describedBy } from './control';

export interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type'> {
  /** Omit only when the checkbox is named another way (`aria-label`, a table header). */
  label?: ReactNode;
  description?: ReactNode;
  invalid?: boolean;
}

export function Checkbox({
  label,
  description,
  invalid,
  id,
  disabled,
  className,
  ...props
}: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;

  const box = (
    <span className="relative inline-flex size-5 shrink-0">
      <input
        type="checkbox"
        id={inputId}
        disabled={disabled}
        className={cn(
          'peer size-5 cursor-pointer appearance-none rounded-md border border-ink-muted/70 bg-surface transition-colors',
          'hover:border-ink-muted checked:border-brand-600 checked:bg-brand-600 aria-invalid:border-danger',
          'disabled:cursor-not-allowed',
        )}
        {...props}
        aria-invalid={invalid ?? props['aria-invalid']}
        aria-describedby={describedBy(props['aria-describedby'], description && descriptionId)}
      />
      <Check
        aria-hidden="true"
        strokeWidth={3.5}
        className="pointer-events-none absolute inset-0 m-auto size-3.5 text-white opacity-0 peer-checked:opacity-100"
      />
    </span>
  );

  if (label === undefined) return <span className={cn('inline-flex', className)}>{box}</span>;

  return (
    <div
      className={cn(
        'grid grid-cols-[auto_minmax(0,1fr)] gap-x-3',
        disabled && 'opacity-60',
        className,
      )}
    >
      <span className="flex h-6 items-center">{box}</span>
      <label
        htmlFor={inputId}
        className={cn(
          CHOICE_LABEL_CLASSES,
          'leading-6',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        )}
      >
        {label}
      </label>
      {description && (
        <p id={descriptionId} className={cn('col-start-2', CHOICE_DESCRIPTION_CLASSES)}>
          {description}
        </p>
      )}
    </div>
  );
}
