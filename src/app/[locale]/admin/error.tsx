'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ErrorState, LinkButton } from '@/components/ui';

export default function AdminError({
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
    <ErrorState
      onRetry={retry}
      action={
        <LinkButton href="/admin" variant="secondary">
          {t('page.home')}
        </LinkButton>
      }
    />
  );
}
