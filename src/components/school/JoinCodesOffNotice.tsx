import { useTranslations } from 'next-intl';
import { Alert, Card, CardTitle, LinkButton } from '@/components/ui';
import { SCHOOL_PATHS } from './paths';

/**
 * Takes the join code panel's place while the school's join codes are off: WS-E's panel would
 * tell the admin to ask their school administrator.
 */
export function JoinCodesOffNotice() {
  const t = useTranslations('school');

  return (
    <Card className="gap-4 p-5 sm:p-6">
      <CardTitle as="h2" className="text-lg">
        {t('class.joinCodesOff.cardTitle')}
      </CardTitle>
      <Alert tone="warning" live="off" title={t('class.joinCodesOff.title')}>
        {t('class.joinCodesOff.description')}
      </Alert>
      <div>
        <LinkButton href={SCHOOL_PATHS.settings} variant="secondary" size="sm">
          {t('class.joinCodesOff.action')}
        </LinkButton>
      </div>
    </Card>
  );
}
