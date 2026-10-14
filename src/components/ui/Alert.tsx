import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TONE_ICON, TONE_PANEL, type StatusTone } from './tones';

const ICONS = { info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleAlert };

export interface AlertProps {
  tone?: StatusTone;
  title?: ReactNode;
  children?: ReactNode;
  /** A button or link shown under the text. */
  action?: ReactNode;
  /**
   * How a screen reader hears it when it appears: `assertive` interrupts (the default for
   * `danger`), `polite` waits (the default otherwise), `off` is for text that is simply part
   * of the page.
   */
  live?: 'assertive' | 'polite' | 'off';
  className?: string;
}

export function Alert({ tone = 'info', title, children, action, live, className }: AlertProps) {
  const Icon = ICONS[tone];
  const politeness = live ?? (tone === 'danger' ? 'assertive' : 'polite');
  return (
    <div
      role={politeness === 'assertive' ? 'alert' : politeness === 'polite' ? 'status' : undefined}
      className={cn(
        'flex items-start gap-3 rounded-control border p-4 text-sm text-ink',
        TONE_PANEL[tone],
        className,
      )}
    >
      <Icon aria-hidden="true" className={cn('mt-0.5 size-5 shrink-0', TONE_ICON[tone])} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5')}>{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
