'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ErrorState, LinkButton } from '@/components/ui';

export default function SharedError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations('errors');
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <ErrorState
        titleAs="h1"
        onRetry={retry}
        action={
          <LinkButton href="/" variant="secondary">
            {t('page.home')}
          </LinkButton>
        }
      />
    </main>
  );
}
