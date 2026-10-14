'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ErrorState, LinkButton } from '@/components/ui';

export default function PublicError({
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
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <ErrorState
        onRetry={retry}
        action={
          <LinkButton href="/" variant="secondary">
            {t('page.home')}
          </LinkButton>
        }
      />
    </div>
  );
}
