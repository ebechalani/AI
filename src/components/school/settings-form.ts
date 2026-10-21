import { useTranslations } from 'next-intl';
import type { ActionError } from '@/types/actions';
import { useActionErrorMessage } from './use-action-error';

/**
 * The form-level message of a failed settings save that is not a field error (SPEC-G 3.1):
 * `forbidden` and `not_found` have their own text, the others the shared error text. The
 * caller refreshes on `unauthenticated` (the page's `requireRole` then sends to the login).
 */
export function useSettingsFailure(): (error: ActionError) => string {
  const t = useTranslations('school');
  const tErrors = useTranslations('errors');
  const errorMessage = useActionErrorMessage();
  return (error) => {
    switch (error.code) {
      case 'forbidden':
        return t('settings.errors.forbidden');
      case 'not_found':
        return t('shared.schoolGone');
      case 'unauthenticated':
        return tErrors('unauthenticated');
      default:
        return errorMessage(error);
    }
  };
}
