import type { ComponentProps } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface LabelProps extends ComponentProps<'label'> {
  /** Adds the asterisk. The control itself carries `required`, which is what is announced. */
  required?: boolean;
  /** Adds "(Optional)" after the text. */
  optional?: boolean;
}

export function Label({ required, optional, className, children, ...props }: LabelProps) {
  const t = useTranslations('common');
  return (
    <label className={cn('block text-sm font-semibold text-ink', className)} {...props}>
      {children}
      {required && (
        <span aria-hidden="true" title={t('a11y.requiredField')} className="ms-0.5 text-danger">
          *
        </span>
      )}
      {optional && (
        <span className="ms-1.5 font-normal text-ink-muted">({t('labels.optional')})</span>
      )}
    </label>
  );
}
