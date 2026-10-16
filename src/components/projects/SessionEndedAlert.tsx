import { LogIn } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert, LinkButton } from '@/components/ui';

export interface SessionEndedAlertProps {
  /** What stays on the page meanwhile ("Your work is still here…"), already translated. */
  description?: string;
  /** The link's label, already translated. */
  loginLabel: string;
  live?: 'assertive' | 'polite' | 'off';
}

/**
 * The session ended while the user was writing: the login opens in a new tab, so nothing typed
 * on this page is lost (no refresh). LinkButton adds the new-tab hint only to absolute URLs, so
 * it is written here.
 */
export function SessionEndedAlert({ description, loginLabel, live }: SessionEndedAlertProps) {
  const tErrors = useTranslations('errors');
  const tCommon = useTranslations('common');
  return (
    <Alert
      tone="danger"
      live={live}
      title={tErrors('unauthenticated')}
      action={
        <LinkButton href="/login" target="_blank" rel="noopener" variant="secondary" size="sm">
          <LogIn aria-hidden="true" />
          {loginLabel}
          <span className="sr-only"> ({tCommon('a11y.opensInNewTab')})</span>
        </LinkButton>
      }
    >
      {description}
    </Alert>
  );
}
