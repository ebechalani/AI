import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, LinkButton, ProgressBar } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface ProgressCardProps {
  title: string;
  subtitle?: string;
  /** 0–100. */
  percent: number;
  /** Locale-less path; with it the card ends in a button. */
  href?: string;
  /** Defaults to "Continue". */
  ctaLabel?: string;
  className?: string;
}

/** Progress through one thing (a course, a pathway) with the way back into it. */
export function ProgressCard({
  title,
  subtitle,
  percent,
  href,
  ctaLabel,
  className,
}: ProgressCardProps) {
  const t = useTranslations('common');
  return (
    <Card tone="brand" className={cn('gap-4 p-5 sm:p-6', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg leading-snug font-semibold text-ink">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        {href && (
          <LinkButton href={href} className="shrink-0 self-start sm:self-auto">
            {ctaLabel ?? t('actions.continue')}
            <ArrowRight aria-hidden="true" className="rtl:rotate-180" />
          </LinkButton>
        )}
      </div>
      <ProgressBar value={percent} label={title} showValue />
    </Card>
  );
}
