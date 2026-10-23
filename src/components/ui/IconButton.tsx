import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import {
  buttonClasses,
  inactiveClasses,
  loadingProps,
  type ButtonSize,
  type ButtonVariant,
} from './Button';
import { SpinnerIcon } from './Spinner';

export interface IconButtonProps extends ComponentProps<'button'> {
  /** The button's only name: its child is an icon. */
  'aria-label': string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** A spinner instead of the icon; unavailable but still focusable, as `Button`'s `loading`. */
  loading?: boolean;
}

export function IconButton({
  variant = 'ghost',
  size = 'md',
  loading = false,
  type = 'button',
  disabled,
  onClick,
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        buttonClasses({ variant, size, iconOnly: true }),
        inactiveClasses(loading),
        className,
      )}
      {...props}
      {...loadingProps(loading, disabled, onClick)}
    >
      {loading ? <SpinnerIcon size="sm" /> : children}
    </button>
  );
}
