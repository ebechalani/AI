import { useTranslations } from 'next-intl';
import { AddStudentsButton } from '@/components/classes/AddStudentsButton';
import type { AccountCreation } from '@/components/classes/class-model';
import { Alert, Card, CardTitle } from '@/components/ui';
import { CONTENT_LIMITS } from '@/lib/limits';

export interface SchoolAddStudentsCardProps {
  classId: string;
  className: string;
  creation: AccountCreation;
  capacityLeft: number;
}

/** Whether accounts can be created here, how much room is left, and WS-E's way in. */
export function SchoolAddStudentsCard({
  classId,
  className,
  creation,
  capacityLeft,
}: SchoolAddStudentsCardProps) {
  const t = useTranslations('school');

  let body;
  if (creation.blocked !== null || creation.defaultBand === null) {
    // For a school class the only block is a suspended school.
    body = (
      <Alert tone="info" live="off" title={t('class.addStudents.inactive.title')}>
        {t('class.addStudents.inactive.description')}
      </Alert>
    );
  } else if (capacityLeft === 0) {
    body = (
      <Alert tone="warning" live="off" title={t('class.addStudents.full.title')}>
        {t('class.addStudents.full.description', { max: CONTENT_LIMITS.studentsPerClass })}
      </Alert>
    );
  } else {
    body = (
      <>
        <div className="flex flex-col gap-1 text-sm text-ink-muted">
          <p>{t('class.addStudents.capacity', { count: capacityLeft })}</p>
          <p>{t('class.addStudents.seats')}</p>
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
          {t('class.addStudents.title')}
        </CardTitle>
        <p className="text-sm text-ink-muted">{t('class.addStudents.description')}</p>
      </div>
      {body}
    </Card>
  );
}
