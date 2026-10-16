import { CalendarDays, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StatusChip, useDateFormat } from '@/components/domain';
import type { Challenge, ChallengePhase } from '@/types/challenge';

export interface ChallengeStatusLineProps {
  challenge: Pick<Challenge, 'startAt' | 'deadlineAt' | 'xpReward'>;
  phase: ChallengePhase;
}

/** Where the challenge stands: its phase, the date that matters now, and the reward. */
export function ChallengeStatusLine({ challenge, phase }: ChallengeStatusLineProps) {
  const t = useTranslations('domain');
  const formatDate = useDateFormat();
  const dateLine =
    phase === 'upcoming'
      ? t('challenge.opensOn', { date: formatDate(challenge.startAt, 'dateTime') })
      : phase === 'open'
        ? t('challenge.dueOn', { date: formatDate(challenge.deadlineAt, 'dateTime') })
        : t('challenge.closedOn', { date: formatDate(challenge.deadlineAt, 'dateTime') });

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <StatusChip status={phase} size="md" />
      <p className="flex items-center gap-1.5 text-ink">
        <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-ink-muted" />
        {dateLine}
      </p>
      {challenge.xpReward > 0 && (
        <p className="flex items-center gap-1.5 font-semibold text-brand-700">
          <Zap aria-hidden="true" className="size-4 shrink-0" />
          {t('challenge.reward', { xp: challenge.xpReward })}
        </p>
      )}
    </div>
  );
}
