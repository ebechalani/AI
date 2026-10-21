import { useTranslations } from 'next-intl';
import { Alert, Card, CardTitle } from '@/components/ui';
import { CONTENT_LIMITS } from '@/lib/limits';
import { AddStudentsButton } from './AddStudentsButton';
import type { AccountCreation } from './class-model';

export interface AddStudentsCardProps {
  classId: string;
  className: string;
  creation: AccountCreation;
  capacityLeft: number;
  /** The class has no school: accounts only for students aged 13 and over. */
  schoolless: boolean;
}

/** Who may get an account here, how much room is left, and the way in. */
export function AddStudentsCard({
  classId,
  className,
  creation,
  capacityLeft,
  schoolless,
}: AddStudentsCardProps) {
  const t = useTranslations('classes');

  let body;
  if (creation.blocked !== null || creation.defaultBand === null) {
    const reason = creation.blocked ?? 'educator_not_verified';
    body = (
      <Alert tone="info" live="off" title={t(`addStudents.blocked.${reason}.title`)}>
        {t(`addStudents.blocked.${reason}.description`)}
      </Alert>
    );
  } else if (capacityLeft === 0) {
    body = (
      <Alert tone="warning" live="off" title={t('addStudents.full.title')}>
        {t('addStudents.full.description', { max: CONTENT_LIMITS.studentsPerClass })}
      </Alert>
    );
  } else {
    body = (
      <>
        <div className="flex flex-col gap-1 text-sm text-ink-muted">
          <p>{t('addStudents.capacity', { count: capacityLeft })}</p>
          {schoolless && <p>{t('addStudents.under13Hint')}</p>}
        </div>
        <div>
          <AddStudentsButton
            classId={classId}
            className={className}
            allowedBands={creation.allowedBands}
            defaultBand={creation.defaultBand}
            capacityLeft={capacityLeft}
          />
        </div>
      </>
    );
  }

  return (
    <Card className="gap-4 p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <CardTitle as="h2" className="text-lg">
          {t('addStudents.title')}
        </CardTitle>
        <p className="text-sm text-ink-muted">{t('addStudents.description')}</p>
      </div>
      {body}
    </Card>
  );
}
