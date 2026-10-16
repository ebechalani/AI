import { useTranslations } from 'next-intl';
import { Alert } from '@/components/ui';

/** For a teacher without a school whose educator account is not verified (ARCHITECTURE.md 1.5). */
export function NotVerifiedNotice({ className }: { className?: string }) {
  const t = useTranslations('classes');
  return (
    <Alert tone="info" title={t('verification.title')} live="off" className={className}>
      {t('verification.description')}
    </Alert>
  );
}
