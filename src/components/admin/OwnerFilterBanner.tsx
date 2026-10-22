import { useTranslations } from 'next-intl';
import { Alert, LinkButton } from '@/components/ui';

export interface OwnerFilterBannerProps {
  message: string;
  clearHref: string;
}

/** "Subscriptions of …" with a link back to the whole list. */
export function OwnerFilterBanner({ message, clearHref }: OwnerFilterBannerProps) {
  const t = useTranslations('admin');
  return (
    <Alert
      tone="info"
      live="off"
      className="mb-6"
      action={
        <LinkButton href={clearHref} variant="secondary" size="sm">
          {t('shared.showAll')}
        </LinkButton>
      }
    >
      {message}
    </Alert>
  );
}
