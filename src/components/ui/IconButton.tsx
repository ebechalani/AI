import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { buttonClasses, inactiveClasses, type ButtonSize, type ButtonVariant } from './Button';
import { SpinnerIcon } from './Spinner';

export interface IconButtonProps extends ComponentProps<'button'> {
  /** The button's only name: its child is an icon. */
  'aria-label': string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function IconButton({
  variant = 'ghost',
  size = 'md',
  loading = false,
  type = 'button',
  disabled,
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        buttonClasses({ variant, size, iconOnly: true }),
        inactiveClasses(loading),
        className,
      )}
      {...props}
    >
      {loading ? <SpinnerIcon size="sm" /> : children}
    </button>
  );
}
