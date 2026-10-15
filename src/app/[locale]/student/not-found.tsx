import { SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState, LinkButton } from '@/components/ui';

export default function StudentNotFound() {
  const t = useTranslations('errors');
  return (
    <main id="main-content" className="flex min-h-dvh items-center justify-center p-6">
      <EmptyState
        variant="plain"
        icon={<SearchX />}
        title={t('notFound.title')}
        titleAs="h1"
        description={t('notFound.description')}
        action={<LinkButton href="/student">{t('notFound.home')}</LinkButton>}
      />
    </main>
  );
}
