import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** The one content width of the marketing pages. */
export const CONTAINER = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8';

export type SectionTone = 'default' | 'muted' | 'dark';

const TONES: Record<SectionTone, { section: string; eyebrow: string; title: string; text: string }> =
  {
    default: {
      section: 'bg-surface',
      eyebrow: 'text-brand-700',
      title: 'text-ink',
      text: 'text-ink-muted',
    },
    muted: {
      section: 'bg-surface-muted',
      eyebrow: 'text-brand-700',
      title: 'text-ink',
      text: 'text-ink-muted',
    },
    dark: {
      section: 'bg-ink text-white',
      eyebrow: 'text-accent-300',
      title: 'text-white',
      text: 'text-white/75',
    },
  };

export interface SectionProps {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  tone?: SectionTone;
  /** `split` puts the heading beside the content from `lg` up; `stack` keeps it above. */
  layout?: 'stack' | 'split';
  /** Rendered under the description, inside the heading column. */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** One homepage section: eyebrow, title, description, then its content. */
export function Section({
  id,
  eyebrow,
  title,
  description,
  tone = 'default',
  layout = 'stack',
  actions,
  children,
  className,
}: SectionProps) {
  const colors = TONES[tone];
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={cn('scroll-mt-20 py-16 sm:py-20 lg:py-24', colors.section, className)}
    >
      <div
        className={cn(
          CONTAINER,
          layout === 'split' && 'grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16',
        )}
      >
        <div className={cn('flex flex-col gap-4', layout === 'stack' && 'max-w-2xl')}>
          {eyebrow && (
            <p className={cn('text-sm font-semibold tracking-wider uppercase', colors.eyebrow)}>
              {eyebrow}
            </p>
          )}
          <h2
            id={id ? `${id}-title` : undefined}
            className={cn(
              'text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl',
              colors.title,
            )}
          >
            {title}
          </h2>
          {description && <p className={cn('text-lg', colors.text)}>{description}</p>}
          {actions && <div className="mt-2 flex flex-wrap gap-3">{actions}</div>}
        </div>
        <div className={cn(layout === 'stack' && 'mt-10 sm:mt-12')}>{children}</div>
      </div>
    </section>
  );
}

export interface FeatureTileProps {
  icon: ReactNode;
  title: string;
  description: string;
  tone?: SectionTone;
  className?: string;
}

/** An icon, a title and one sentence: the unit of every feature grid on the homepage. */
export function FeatureTile({ icon, title, description, tone = 'default', className }: FeatureTileProps) {
  const dark = tone === 'dark';
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-card border p-5',
        dark ? 'border-white/10 bg-white/5' : 'border-border bg-surface shadow-card',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex size-11 items-center justify-center rounded-control [&>svg]:size-5',
          dark ? 'bg-accent-400/15 text-accent-300' : 'bg-brand-100 text-brand-700',
        )}
      >
        {icon}
      </span>
      <h3 className={cn('text-base leading-snug font-semibold', dark ? 'text-white' : 'text-ink')}>
        {title}
      </h3>
      <p className={cn('text-sm', dark ? 'text-white/70' : 'text-ink-muted')}>{description}</p>
    </div>
  );
}
