import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CHOICE_DESCRIPTION_CLASSES, CHOICE_LABEL_CLASSES, describedBy } from './control';
import { FieldMessages } from './FormField';

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /** The question the options answer; rendered as the fieldset's legend. */
  legend: ReactNode;
  /** Keeps the legend for screen readers only (when a heading above already says it). */
  hideLegend?: boolean;
  name: string;
  options: readonly RadioOption[];
  /** Controlled value. Without `onValueChange` the group is a read-only display. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'vertical' | 'horizontal';
  /** `card` gives every option its own bordered, fully clickable row (quiz answers). */
  variant?: 'plain' | 'card';
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function RadioGroup({
  legend,
  hideLegend = false,
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  orientation = 'vertical',
  variant = 'plain',
  hint,
  error,
  required,
  disabled,
  className,
}: RadioGroupProps) {
  const groupId = useId();
  const hintId = `${groupId}-hint`;
  const errorId = `${groupId}-error`;
  const controlled = value !== undefined;

  return (
    <fieldset
      role="radiogroup"
      aria-required={required || undefined}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(hint && hintId, error && errorId)}
      disabled={disabled}
      className={cn('min-w-0', className)}
    >
      <legend className={cn(hideLegend ? 'sr-only' : 'mb-2 text-sm font-semibold text-ink')}>
        {legend}
      </legend>
      <div
        className={cn(
          'flex',
          orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
          variant === 'card' ? 'gap-2.5' : orientation === 'vertical' ? 'gap-2' : 'gap-x-6 gap-y-2',
        )}
      >
        {options.map((option) => {
          const optionDisabled = disabled || option.disabled;
          return (
            <label
              key={option.value}
              className={cn(
                'group relative isolate flex items-start gap-3',
                variant === 'card' ? 'rounded-control px-4 py-3' : 'py-0.5',
                optionDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={controlled ? value === option.value : undefined}
                defaultChecked={
                  !controlled && defaultValue !== undefined
                    ? defaultValue === option.value
                    : undefined
                }
                onChange={onValueChange ? (event) => onValueChange(event.target.value) : undefined}
                readOnly={controlled && !onValueChange}
                required={required}
                disabled={option.disabled}
                className={cn(
                  // The dot is the surface showing through a thick border.
                  'peer mt-0.5 size-5 shrink-0 cursor-[inherit] appearance-none rounded-full border border-ink-muted/70 bg-surface transition-[border-color,border-width]',
                  'hover:border-ink-muted checked:border-[6px] checked:border-brand-600',
                  // A card shows the focus ring around the whole row (the span below).
                  variant === 'card' && 'focus-visible:outline-none',
                )}
              />
              {variant === 'card' && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 rounded-control border border-ink-muted/70 bg-surface transition-colors group-hover:border-ink-muted peer-checked:border-2 peer-checked:border-brand-600! peer-checked:bg-brand-50 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-600"
                />
              )}
              <span className="min-w-0">
                <span className={cn('block leading-6', CHOICE_LABEL_CLASSES)}>{option.label}</span>
                {option.description && (
                  <span className={cn('block', CHOICE_DESCRIPTION_CLASSES)}>
                    {option.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      <FieldMessages hint={hint} hintId={hintId} error={error} errorId={errorId} />
    </fieldset>
  );
}
