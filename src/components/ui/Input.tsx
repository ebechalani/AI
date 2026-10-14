import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { CONTROL_CLASSES } from './control';

export interface InputProps extends ComponentProps<'input'> {
  /** Shorthand for `aria-invalid`; `FormField` sets it for you when it has an error. */
  invalid?: boolean;
}

export function Input({ invalid, type = 'text', className, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(CONTROL_CLASSES, 'min-h-11 py-2 [&[readonly]]:bg-surface-muted', className)}
      {...props}
      aria-invalid={invalid ?? props['aria-invalid']}
    />
  );
}
