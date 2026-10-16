import { useTranslations } from 'next-intl';
import { StatusChip, XPBadge } from '@/components/domain';
import { Avatar, Card } from '@/components/ui';
import type { StudentSummary } from '@/types/user';

export interface StudentSummaryCardProps {
  summary: StudentSummary;
  className: string;
}

/** Who the student is: avatar, name, username, age group, level and XP. */
export function StudentSummaryCard({ summary }: StudentSummaryCardProps) {
  const t = useTranslations('classes');
  const tDomain = useTranslations('domain');

  return (
    <Card tone="brand" className="gap-4 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <Avatar avatarId={summary.avatarId} size="lg" />
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-lg leading-snug font-bold break-words text-ink">
            {summary.displayName}
          </h2>
          {summary.username !== null ? (
            <p translate="no" className="font-mono text-sm break-all text-ink-muted">
              {summary.username}
            </p>
          ) : (
            <p className="text-sm text-ink-muted">{t('student.summary.ownAccount')}</p>
          )}
          <p className="text-sm text-ink-muted">{tDomain(`ageBands.${summary.ageBand}`)}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <XPBadge xp={summary.xpTotal} level={summary.level} />
        {summary.status === 'disabled' && <StatusChip status="disabled" />}
      </div>
    </Card>
  );
}
