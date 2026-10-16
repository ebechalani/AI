import { Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ChallengeCard } from '@/components/domain';
import { Alert, EmptyState } from '@/components/ui';
import type { Challenge } from '@/types/challenge';
import type { IsoDateString } from '@/types/common';
import { PageSection } from './PageSection';

export interface RoboticsChallengesProps {
  /** Open and upcoming robot challenges, soonest deadline first; null when the read failed. */
  challenges: readonly Challenge[] | null;
  /** The render time, from which each card derives its phase. */
  now: IsoDateString;
}

export function RoboticsChallenges({ challenges, now }: RoboticsChallengesProps) {
  const t = useTranslations('robotics');
  return (
    <PageSection
      id="robotics-challenges"
      title={t('challenges.title')}
      description={t('challenges.description')}
      action={{ href: '/student/challenges', label: t('challenges.viewAll') }}
    >
      {challenges === null ? (
        <Alert tone="warning" live="off">
          {t('sectionError')}
        </Alert>
      ) : challenges.length === 0 ? (
        <EmptyState
          icon={<Trophy />}
          title={t('challenges.empty.title')}
          description={t('challenges.empty.description')}
        />
      ) : (
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
      )}
    </PageSection>
  );
}
