import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { StatusChip, useAgeRangeLabel, useDateFormat } from '@/components/domain';
import { Card, CardTitle, Chip } from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';
import type { Challenge, ChallengePhase } from '@/types/challenge';

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="font-medium text-ink-muted">{label}</dt>
      <dd className="min-w-0 break-words text-ink">{children}</dd>
    </>
  );
}

export interface ChallengeFactsProps {
  challenge: Challenge;
  phase: ChallengePhase;
}

/** The key facts of a challenge, in the side column. Ages are guidance only, never a gate. */
export function ChallengeFacts({ challenge, phase }: ChallengeFactsProps) {
  const t = useTranslations('challenges');
  const tDomain = useTranslations('domain');
  const tRobotics = useTranslations('robotics');
  const locale = useLocale();
  const formatDate = useDateFormat();
  const ages = useAgeRangeLabel()(challenge.ageMin, challenge.ageMax);
  const types = new Intl.ListFormat(locale, { type: 'disjunction' }).format(
    challenge.allowedSubmissionTypes.map((type) => tDomain(`submissionTypes.${type}`)),
  );

  return (
    <Card as="section" aria-labelledby="challenge-facts" className="gap-4 p-5 sm:p-6">
      <CardTitle as="h2" id="challenge-facts" className="text-lg">
        {t('facts.title')}
      </CardTitle>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
        <Fact label={t('facts.status')}>
          <StatusChip status={phase} />
        </Fact>
        <Fact label={t(phase === 'upcoming' ? 'facts.opens' : 'facts.opened')}>
          {formatDate(challenge.startAt, 'dateTime')}
        </Fact>
        <Fact label={t('facts.deadline')}>{formatDate(challenge.deadlineAt, 'dateTime')}</Fact>
        {challenge.xpReward > 0 && (
          <Fact label={t('facts.reward')}>
            <span className="font-semibold text-brand-700">
              {tDomain('xp.amount', { xp: challenge.xpReward })}
            </span>
          </Fact>
        )}
        <Fact label={t('facts.ages')}>{ages ?? t('facts.allAges')}</Fact>
        <Fact label={t('facts.openTo')}>
          {t(challenge.scope === 'school' ? 'facts.scopeSchool' : 'facts.scopeGlobal')}
        </Fact>
        {challenge.allowedSubmissionTypes.length > 0 && (
          <Fact label={t('facts.types')}>{types}</Fact>
        )}
      </dl>
      {challenge.requiredCapabilities.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
          <p className="font-medium text-ink-muted">{t('facts.hardware')}</p>
          <ul className="flex flex-wrap gap-1.5">
            {challenge.requiredCapabilities.map((capability) => (
              <li key={capability} className="max-w-full">
                <Chip>{tRobotics(`capabilities.${capability}`)}</Chip>
              </li>
            ))}
          </ul>
          <Link
            href="/student/robotics#robotics-hardware"
            className="inline-flex min-h-6 items-center gap-1 self-start rounded-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline"
          >
            {t('facts.hardwareLink')}
            <ArrowRight aria-hidden="true" className="size-4 shrink-0 rtl:rotate-180" />
          </Link>
        </div>
      )}
    </Card>
  );
}
