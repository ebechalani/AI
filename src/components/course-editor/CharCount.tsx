import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

/** "{count} / {max} characters", red above the limit (the schema reports `too_long`). */
export function CharCount({ count, max }: { count: number; max: number }) {
  const t = useTranslations('courseEditor');
  return (
    <span className={cn('block', count > max && 'font-medium text-danger')}>
      {t('limits.charCount', { count, max })}
    </span>
  );
}
