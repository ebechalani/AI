import { BadgeCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface CertifiedBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

/** Marks an official course: "RoboHolic Certified". */
export function CertifiedBadge({ size = 'sm', className }: CertifiedBadgeProps) {
  const t = useTranslations('domain');
  return (
    <span
      title={t('certified.description')}
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full bg-linear-to-r from-brand-600 to-accent-700 font-semibold whitespace-nowrap text-white',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        className,
      )}
    >
      <BadgeCheck
        aria-hidden="true"
        className={cn('shrink-0', size === 'sm' ? 'size-3.5' : 'size-4')}
      />
      <span className="truncate">{t('certified.label')}</span>
    </span>
  );
}
