import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CHOICE_DESCRIPTION_CLASSES, CHOICE_LABEL_CLASSES, describedBy } from './control';

export interface SwitchProps extends Omit<ComponentProps<'input'>, 'type' | 'role'> {
  /** Omit only when the switch is named with `aria-label`. */
  label?: ReactNode;
  description?: ReactNode;
  /** `end` (default) puts the text after the switch; `start` puts it first and pushes the switch to the far edge, as in a settings row. */
  labelPosition?: 'start' | 'end';
}

/**
 * A native checkbox with `role="switch"`: it submits with a form and works without script.
 * `checked` / `defaultChecked` / `onChange` are the checkbox ones.
 */
export function Switch({
  label,
  description,
  labelPosition = 'end',
  id,
  disabled,
  className,
  ...props
}: SwitchProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;

  const control = (
    <input
      type="checkbox"
      role="switch"
      id={inputId}
      disabled={disabled}
      className={cn(
        // The thumb is ::before and moves by margin-inline-start, so it mirrors in RTL.
        'inline-flex h-6 w-11 shrink-0 cursor-pointer appearance-none items-center rounded-full bg-ink-muted/70 p-0.5 transition-colors',
        "before:block before:size-5 before:rounded-full before:bg-white before:shadow-sm before:transition-[margin] before:content-['']",
        'hover:bg-ink-muted checked:bg-brand-600 checked:before:ms-5 checked:hover:bg-brand-700',
        'disabled:cursor-not-allowed',
        // Forced colours (Windows contrast themes) repaint every background with the page
        // colour, which would leave neither track nor thumb: both are redrawn in system colours.
        'forced-colors:border forced-colors:border-[ButtonText] forced-colors:p-px forced-colors:before:bg-[ButtonText]',
        'forced-colors:checked:bg-[Highlight] forced-colors:checked:before:bg-[HighlightText]',
      )}
      {...props}
      aria-describedby={describedBy(props['aria-describedby'], description && descriptionId)}
    />
  );

  if (label === undefined) return <span className={cn('inline-flex', className)}>{control}</span>;

  const text = (
    <span className="min-w-0">
      <label
        htmlFor={inputId}
        className={cn(
          CHOICE_LABEL_CLASSES,
          'block leading-6',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        )}
      >
        {label}
      </label>
      {description && (
        <span id={descriptionId} className={cn('block', CHOICE_DESCRIPTION_CLASSES)}>
          {description}
        </span>
      )}
    </span>
  );

  return (
    <div
      className={cn(
        'flex items-start gap-3',
        labelPosition === 'start' && 'justify-between gap-4',
        disabled && 'opacity-60',
        className,
      )}
    >
      {labelPosition === 'start' && text}
      {control}
      {labelPosition === 'end' && text}
    </div>
  );
}
