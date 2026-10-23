import { LogIn } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert, LinkButton } from '@/components/ui';

/**
 * The session ended while the author was editing: the login opens in a new tab, so nothing typed
 * on this page is lost (no refresh). The course editor's own copy of WS-D's pattern.
 */
export function SessionEndedAlert() {
  const t = useTranslations('courseEditor');
  const tErrors = useTranslations('errors');
  const tCommon = useTranslations('common');
  return (
    <Alert
      tone="danger"
      live="assertive"
      title={tErrors('unauthenticated')}
      action={
        <LinkButton href="/login" target="_blank" rel="noopener" variant="secondary" size="sm">
          <LogIn aria-hidden="true" />
          {t('errors.loginAgain')}
          <span className="sr-only"> ({tCommon('a11y.opensInNewTab')})</span>
        </LinkButton>
      }
    >
      {t('errors.sessionEnded')}
    </Alert>
  );
}
