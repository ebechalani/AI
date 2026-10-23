'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ErrorState, LinkButton } from '@/components/ui';

export default function TeacherPlayerError({
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
    <main id="main-content" className="flex min-h-dvh items-center justify-center p-6">
      <ErrorState
        titleAs="h1"
        onRetry={retry}
        action={
          <LinkButton href="/teacher/courses" variant="secondary">
            {t('page.home')}
          </LinkButton>
        }
      />
    </main>
  );
}
