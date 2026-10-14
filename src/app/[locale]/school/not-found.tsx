import { SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState, LinkButton } from '@/components/ui';

export default function SchoolNotFound() {
  const t = useTranslations('errors');
  return (
    <EmptyState
      icon={<SearchX />}
      title={t('notFound.title')}
      description={t('notFound.description')}
      action={<LinkButton href="/school">{t('notFound.home')}</LinkButton>}
    />
  );
}
