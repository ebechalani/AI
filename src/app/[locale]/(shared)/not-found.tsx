import { SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState, LinkButton } from '@/components/ui';

export default function SharedNotFound() {
  const t = useTranslations('errors');
  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <EmptyState
        icon={<SearchX />}
        title={t('notFound.title')}
        description={t('notFound.description')}
        action={<LinkButton href="/">{t('notFound.home')}</LinkButton>}
      />
    </main>
  );
}
