import { Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ChallengeCard } from '@/components/domain';
import { EmptyState } from '@/components/ui';
import type { Challenge } from '@/types/challenge';
import type { IsoDateString } from '@/types/common';
import { SectionUnavailable } from './SectionUnavailable';

export interface UpcomingChallengesProps {
  /** Open and upcoming challenges, soonest deadline first; null when they could not be read. */
  challenges: readonly Challenge[] | null;
  /** The render time, from which each card derives the challenge's phase. */
  now: IsoDateString;
}

export function UpcomingChallenges({ challenges, now }: UpcomingChallengesProps) {
  const t = useTranslations('student');

  if (challenges === null) return <SectionUnavailable />;
  if (challenges.length === 0) {
    return (
      <EmptyState
        icon={<Trophy />}
        title={t('challenges.empty.title')}
        description={t('challenges.empty.description')}
      />
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {challenges.map((challenge) => (
        <li key={challenge.id} className="min-w-0">
          <ChallengeCard
            challenge={challenge}
            href={`/student/challenges/${challenge.id}`}
            now={now}
          />
        </li>
      ))}
    </ul>
  );
}
