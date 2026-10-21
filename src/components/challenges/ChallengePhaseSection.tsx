import { CalendarClock, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ChallengeCard } from '@/components/domain';
import { PageSection } from '@/components/robotics/PageSection';
import { EmptyState } from '@/components/ui';
import type { Challenge, ChallengePhase } from '@/types/challenge';
import type { IsoDateString } from '@/types/common';

export interface ChallengePhaseSectionProps {
  phase: ChallengePhase;
  /** The challenges in this phase, already sorted. */
  challenges: readonly Challenge[];
  /** The render time, from which each card derives its phase. */
  now: IsoDateString;
  /** Ids of the challenges the student has entered. */
  entered: ReadonlySet<string>;
}

/** One group of the Challenge Arena: open now, coming soon or closed. */
export function ChallengePhaseSection({
  phase,
  challenges,
  now,
  entered,
}: ChallengePhaseSectionProps) {
  const t = useTranslations('challenges');
  const count = challenges.length;
  return (
    <PageSection
      id={`challenges-${phase}`}
      title={t(`phases.${phase}.title`)}
      // No "No challenge" line above an empty state that says the same.
      description={count > 0 ? t('count', { count }) : undefined}
    >
      {count === 0 ? (
        phase !== 'closed' && (
          <EmptyState
            variant="plain"
            icon={phase === 'open' ? <Trophy /> : <CalendarClock />}
            title={t(`phases.${phase}.empty`)}
            className="py-6"
          />
        )
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {challenges.map((challenge) => (
            <li key={challenge.id} className="min-w-0">
              <ChallengeCard
                challenge={challenge}
                href={`/student/challenges/${challenge.id}`}
                now={now}
                entered={entered.has(challenge.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </PageSection>
  );
}
