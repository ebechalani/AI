import type { ComponentProps } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CONTROL_CLASSES } from './control';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends ComponentProps<'select'> {
  invalid?: boolean;
  /** Rendered after any `children`; pass one or the other. */
  options?: readonly SelectOption[];
  /** An empty-valued first option, shown while nothing is chosen. */
  placeholder?: string;
}

/** A native select: `className` goes to the wrapper (width, margins), not to the element. */
export function Select({
  invalid,
  options,
  placeholder,
  className,
  children,
  ...props
}: SelectProps) {
  return (
    <div className={cn('relative', className)}>
      <select
        className={cn(CONTROL_CLASSES, 'min-h-11 cursor-pointer appearance-none py-2 pe-10')}
        {...props}
        aria-invalid={invalid ?? props['aria-invalid']}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {children}
        {options?.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
      />
    </div>
  );
}
