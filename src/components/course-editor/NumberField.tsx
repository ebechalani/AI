'use client';

import type { ReactNode } from 'react';
import { FormField, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface NumberFieldProps {
  label: string;
  value: string;
  onChange(value: string): void;
  min: number;
  max: number;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  /** Shown after the input (a unit such as %). */
  suffix?: string;
  className?: string;
}

/** A whole number typed as text (the draft keeps what was typed); its bounds go in the hint. */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  hint,
  error,
  required,
  disabled,
  id,
  placeholder,
  suffix,
  className,
}: NumberFieldProps) {
  return (
    <FormField id={id} label={label} hint={hint} error={error} required={required} className={className}>
      {(control) => (
        <div className="flex items-center gap-2">
          <Input
            {...control}
            type="number"
            inputMode="numeric"
            step={1}
            min={min}
            max={max}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            className={cn('max-w-40')}
          />
          {suffix && (
            <span aria-hidden="true" className="text-sm text-ink-muted">
              {suffix}
            </span>
          )}
        </div>
      )}
    </FormField>
  );
}
