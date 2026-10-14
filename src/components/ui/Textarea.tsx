import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { CONTROL_CLASSES } from './control';

export interface TextareaProps extends ComponentProps<'textarea'> {
  invalid?: boolean;
}

export function Textarea({ invalid, rows = 4, className, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(
        CONTROL_CLASSES,
        'min-h-24 resize-y py-2.5 leading-relaxed [&[readonly]]:bg-surface-muted',
        className,
      )}
      {...props}
      aria-invalid={invalid ?? props['aria-invalid']}
    />
  );
}
