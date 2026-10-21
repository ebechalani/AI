import { useTranslations } from 'next-intl';
import { Card, CardTitle } from '@/components/ui';
import type { StudentSummary } from '@/types/user';
import { ResetPasswordButton } from './ResetPasswordButton';

export interface ResetPasswordCardProps {
  summary: StudentSummary;
  className: string;
}

/** Who can reset this student's password, and the button when the viewer can. */
export function ResetPasswordCard({ summary, className }: ResetPasswordCardProps) {
  const t = useTranslations('classes');
  const name = summary.displayName;

  return (
    <Card className="gap-3 p-5 sm:p-6">
      <CardTitle as="h2" className="text-lg">
        {t('resetPassword.title')}
      </CardTitle>
      {summary.canResetPassword ? (
        <>
          <p className="text-sm text-ink-muted">{t('resetPassword.description', { name })}</p>
          <div>
            <ResetPasswordButton
              studentUid={summary.uid}
              studentName={name}
              className={className}
            />
          </div>
        </>
      ) : (
        <p className="text-sm text-ink-muted">
          {summary.username === null
            ? t('resetPassword.notAvailable', { name })
            : t('resetPassword.notManaged')}
        </p>
      )}
    </Card>
  );
}
