import { useId, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChoiceOption {
  value: string;
  label: ReactNode;
}

export interface ChoiceCheckboxesProps {
  /** The question; rendered as the fieldset's legend. */
  legend: ReactNode;
  hint: ReactNode;
  name: string;
  options: readonly ChoiceOption[];
  values: readonly string[];
  /** Without it the boxes are a disabled, read-only display (the preview). */
  onToggle?: (value: string, checked: boolean) => void;
  disabled?: boolean;
}

/**
 * A group of checkboxes drawn as answer cards, the multiple-answer twin of RadioGroup's `card`
 * variant: the whole row (at least 44 px high) is the click target and shows the focus ring.
 */
export function ChoiceCheckboxes({
  legend,
  hint,
  name,
  options,
  values,
  onToggle,
  disabled = false,
}: ChoiceCheckboxesProps) {
  const hintId = `${useId()}-hint`;
  const readOnly = onToggle === undefined;
  const inactive = disabled || readOnly;

  return (
    <fieldset aria-describedby={hintId} disabled={disabled} className="min-w-0">
      <legend className="mb-2 text-sm font-semibold text-ink">{legend}</legend>
      <div className="flex flex-col gap-2.5">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'group relative isolate flex items-start gap-3 rounded-control px-4 py-3',
              inactive ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
            )}
          >
            <input
              type="checkbox"
              name={name}
              value={option.value}
              checked={values.includes(option.value)}
              onChange={
                onToggle ? (event) => onToggle(option.value, event.target.checked) : undefined
              }
              readOnly={readOnly}
              disabled={inactive}
              className="peer mt-0.5 size-5 shrink-0 cursor-[inherit] appearance-none rounded-md border border-ink-muted/70 bg-surface transition-colors checked:border-brand-600 checked:bg-brand-600 hover:border-ink-muted focus-visible:outline-none"
            />
            {/* The tick sits over the box (same place: px-4, py-3 plus the box's mt-0.5). */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-s-4 top-3.5 flex size-5 items-center justify-center text-white opacity-0 peer-checked:opacity-100"
            >
              <Check strokeWidth={3.5} className="size-3.5" />
            </span>
            <span
              aria-hidden="true"
              className="absolute inset-0 -z-10 rounded-control border border-ink-muted/70 bg-surface transition-colors group-hover:border-ink-muted peer-checked:border-2 peer-checked:border-brand-600! peer-checked:bg-brand-50 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-600"
            />
            <span className="block min-w-0 text-sm leading-6 font-medium text-ink">
              {option.label}
            </span>
          </label>
        ))}
      </div>
      <p id={hintId} className="mt-1.5 text-sm text-ink-muted">
        {hint}
      </p>
    </fieldset>
  );
}
