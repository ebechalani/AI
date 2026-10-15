import { SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState, LinkButton } from '@/components/ui';

export default function AdminNotFound() {
  const t = useTranslations('errors');
  return (
    <EmptyState
      icon={<SearchX />}
      title={t('notFound.title')}
      titleAs="h1"
      description={t('notFound.description')}
      action={<LinkButton href="/admin">{t('notFound.home')}</LinkButton>}
    />
  );
}
