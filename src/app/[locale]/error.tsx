'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ErrorState, LinkButton } from '@/components/ui';

export default function LocaleError({
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
    <div className="flex min-h-dvh items-center justify-center p-6">
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
