import { SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState, LinkButton } from '@/components/ui';

export default function PublicNotFound() {
  const t = useTranslations('errors');
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <EmptyState
        icon={<SearchX />}
        title={t('notFound.title')}
        description={t('notFound.description')}
        action={<LinkButton href="/">{t('notFound.home')}</LinkButton>}
      />
    </div>
  );
}
