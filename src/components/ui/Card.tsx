import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type DivProps = HTMLAttributes<HTMLElement>;

export interface CardProps extends DivProps {
  as?: 'div' | 'section' | 'article' | 'li';
  /** `brand` is the one subtle brand gradient, for hero and progress surfaces. */
  tone?: 'default' | 'muted' | 'brand';
  /** Lifts on hover and when something inside has focus: for a card that is one big link. */
  interactive?: boolean;
}

const TONES = {
  default: 'border-border bg-surface shadow-card',
  muted: 'border-border bg-surface-muted',
  brand: 'border-brand-100 bg-linear-to-br from-brand-50 via-surface to-accent-50 shadow-card',
} as const;

/**
 * The card does not clip its content, so a tooltip inside it can overflow. An image flush with
 * the top edge therefore rounds its own corners (`rounded-t-card`).
 */
export function Card({
  as: Tag = 'div',
  tone = 'default',
  interactive = false,
  className,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn(
        'relative flex min-w-0 flex-col rounded-card border text-ink',
        TONES[tone],
        interactive &&
          'transition-[box-shadow,border-color,translate] duration-200 focus-within:border-brand-300 hover:border-brand-200 hover:shadow-lg motion-safe:hover:-translate-y-0.5',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 pt-5 sm:px-6 sm:pt-6',
        className,
      )}
      {...props}
    />
  );
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h2' | 'h3' | 'h4';
}

export function CardTitle({ as: Tag = 'h3', className, ...props }: CardTitleProps) {
  return (
    <Tag className={cn('text-base leading-snug font-semibold text-ink', className)} {...props} />
  );
}

export function CardBody({ className, ...props }: DivProps) {
  return <div className={cn('flex-1 px-5 py-5 sm:px-6', className)} {...props} />;
}

export function CardFooter({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-b-card border-t border-border px-5 py-4 sm:px-6',
        className,
      )}
      {...props}
    />
  );
}
