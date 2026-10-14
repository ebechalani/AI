'use client';

import { useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FormField, IconButton, Input } from '@/components/ui';

export interface PasswordFieldProps
  extends Pick<ComponentProps<'input'>, 'name' | 'autoComplete' | 'value' | 'onChange'> {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

/** A password input with a show/hide toggle beside it (the toggle never hides the control). */
export function PasswordField({
  label,
  hint,
  error,
  required,
  name,
  autoComplete,
  value,
  onChange,
}: PasswordFieldProps) {
  const t = useTranslations('auth');
  const [visible, setVisible] = useState(false);

  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {(control) => (
        <div className="flex items-start gap-2">
          <Input
            {...control}
            type={visible ? 'text' : 'password'}
            name={name}
            autoComplete={autoComplete}
            spellCheck={false}
            value={value}
            onChange={onChange}
          />
          <IconButton
            variant="secondary"
            aria-label={visible ? t('password.hide') : t('password.show')}
            aria-pressed={visible}
            onClick={() => setVisible((shown) => !shown)}
          >
            {visible ? <EyeOff /> : <Eye />}
          </IconButton>
        </div>
      )}
    </FormField>
  );
}
