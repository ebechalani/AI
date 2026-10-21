import type { ComponentProps, MouseEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import { SpinnerIcon } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-control text-center font-semibold ' +
  'transition-colors select-none [&>svg]:shrink-0 disabled:pointer-events-none';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800',
  secondary:
    'border border-border bg-surface text-ink shadow-sm hover:border-brand-200 hover:bg-brand-50 active:bg-brand-100',
  ghost: 'text-brand-700 hover:bg-brand-50 active:bg-brand-100',
  danger: 'bg-danger text-white shadow-sm hover:brightness-90 active:brightness-75',
};

// Minimum heights, not fixed ones: a long label (French) wraps instead of overflowing.
const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 py-1.5 text-sm [&>svg]:size-4',
  md: 'min-h-11 px-4 py-2 text-sm [&>svg]:size-4',
  lg: 'min-h-12 px-6 py-2.5 text-base [&>svg]:size-5',
};

// An icon-only ghost button is chrome (close, dismiss, more), so it is ink-coloured, not brand.
// It is a class list of its own because cn() does not resolve two text colours on one element.
const ICON_ONLY_GHOST = 'text-ink-muted hover:bg-surface-muted hover:text-ink active:bg-border/70';

const ICON_ONLY_SIZES: Record<ButtonSize, string> = {
  sm: 'size-9 [&>svg]:size-4',
  md: 'size-11 [&>svg]:size-5',
  lg: 'size-12 [&>svg]:size-6',
};

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Square, no padding: the IconButton shape. */
  iconOnly?: boolean;
}

/** The button look as a class list, for the rare element that is neither Button nor LinkButton. */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  iconOnly = false,
}: ButtonStyleOptions = {}): string {
  return cn(
    BASE,
    iconOnly && variant === 'ghost' ? ICON_ONLY_GHOST : VARIANTS[variant],
    iconOnly ? ICON_ONLY_SIZES[size] : SIZES[size],
    iconOnly && 'shrink-0',
    fullWidth && 'w-full',
  );
}

/**
 * A disabled button fades; a loading one fades less, because the spinner already says why. A
 * loading button is `aria-disabled` rather than natively disabled (`loadingProps`), so its look
 * comes from `aria-disabled:` variants (with `disabled:` kept for one that is both).
 */
export function inactiveClasses(loading: boolean): string {
  return loading
    ? 'disabled:opacity-80 aria-disabled:pointer-events-none aria-disabled:opacity-80'
    : 'disabled:opacity-60';
}

/** Cancels the click of a loading button: its action, and the form submission it would start. */
function ignoreWhileLoading(event: MouseEvent<HTMLButtonElement>): void {
  event.preventDefault();
  event.stopPropagation();
}

/**
 * The state attributes of a `Button` or `IconButton` (ARCHITECTURE.md 7.3). `disabled` stays
 * native. A button that is only `loading` keeps the keyboard focus for the whole request
 * (a natively disabled control drops it to `<body>`): it is `aria-disabled` and `aria-busy`,
 * and its click is cancelled, which also cancels the implicit submission of its form by Enter
 * in a field (the browser submits by clicking the default button), so a form still cannot be
 * sent twice. The caller's `onClick` runs only when the button is neither.
 */
export function loadingProps(
  loading: boolean,
  disabled: boolean | undefined,
  onClick: ComponentProps<'button'>['onClick'],
): Pick<ComponentProps<'button'>, 'disabled' | 'aria-disabled' | 'aria-busy' | 'onClick'> {
  if (disabled) return { disabled: true, onClick, ...(loading && { 'aria-busy': true }) };
  if (!loading) return { onClick };
  return { 'aria-disabled': true, 'aria-busy': true, onClick: ignoreWhileLoading };
}

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Shows a spinner and makes the button unavailable while it keeps the keyboard focus:
   * `aria-disabled` and `aria-busy`, clicks and the form submission they would start ignored.
   */
  loading?: boolean;
  fullWidth?: boolean;
}

/** `type` defaults to `button`; a form's submit button passes `type="submit"`. */
export function Button({
  variant,
  size = 'md',
  loading = false,
  fullWidth,
  type = 'button',
  disabled,
  onClick,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        buttonClasses({ variant, size, fullWidth }),
        inactiveClasses(loading),
        className,
      )}
      {...props}
      {...loadingProps(loading, disabled, onClick)}
    >
      {loading && <SpinnerIcon size={size === 'lg' ? 'md' : 'sm'} />}
      {children}
    </button>
  );
}

function NewTabHint() {
  const t = useTranslations('common');
  return <span className="sr-only">({t('a11y.opensInNewTab')})</span>;
}

const OTHER_SITE = /^https?:\/\//i;
const NOT_A_PAGE = /^(?:https?:|mailto:|tel:|#)/i;

export interface LinkButtonProps extends Omit<ComponentProps<'a'>, 'href'> {
  /**
   * A locale-less internal path (`/student/learn`), or an absolute URL, `mailto:`, `tel:` or
   * `#fragment`. Absolute http(s) URLs open in a new tab.
   */
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Renders a plain anchor with no locale prefix: for same-origin non-page URLs (`/api/files/…`). */
  external?: boolean;
}

export function LinkButton({
  href,
  variant,
  size,
  fullWidth,
  external,
  className,
  children,
  ...props
}: LinkButtonProps) {
  const classes = cn(buttonClasses({ variant, size, fullWidth }), className);
  if (external ?? NOT_A_PAGE.test(href)) {
    const newTab = OTHER_SITE.test(href);
    return (
      <a
        href={href}
        className={classes}
        {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
        {...props}
      >
        {children}
        {newTab && <NewTabHint />}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
}
