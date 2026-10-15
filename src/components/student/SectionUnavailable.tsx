import { useTranslations } from 'next-intl';
import { Alert } from '@/components/ui';

/** Stands in for one Home section whose read failed; the rest of the page keeps working. */
export function SectionUnavailable() {
  const t = useTranslations('student');
  return (
    <Alert tone="warning" live="off">
      {t('sectionError')}
    </Alert>
  );
}
