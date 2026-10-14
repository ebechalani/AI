import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TONE_SOFT, type ChipTone } from './tones';

export interface ChipProps extends ComponentProps<'span'> {
  tone?: ChipTone;
  size?: 'sm' | 'md';
  /** A decorative icon before the text (the chip's meaning is never the colour or icon alone). */
  icon?: ReactNode;
}

export function Chip({
  tone = 'neutral',
  size = 'sm',
  icon,
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full font-semibold whitespace-nowrap [&>svg]:shrink-0',
        size === 'sm'
          ? 'px-2.5 py-0.5 text-xs [&>svg]:size-3.5'
          : 'px-3 py-1 text-sm [&>svg]:size-4',
        TONE_SOFT[tone],
        className,
      )}
      {...props}
    >
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}
