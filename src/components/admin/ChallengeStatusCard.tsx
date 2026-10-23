import { useTranslations } from 'next-intl';
import { StatusChip } from '@/components/domain';
import { Card, CardBody, LinkButton } from '@/components/ui';
import { getChallengePhase } from '@/lib/learning/challenge-phase';
import type { Challenge } from '@/types/challenge';
import type { IsoDateString } from '@/types/common';
import { ChallengeStatusButtons } from './ChallengeStatusButtons';
import { adminChallengeEntriesPath } from './paths';

export interface ChallengeStatusCardProps {
  challenge: Challenge;
  now: IsoDateString;
  /** The audience and the dates, formatted by the page for the publish confirmation. */
  audience: string;
  start: string;
  end: string;
  /** The challenge's title, or the "untitled" fallback. */
  title: string;
}

/** The state of a challenge on its edit page, with the transitions and a link to its entries. */
export function ChallengeStatusCard({
  challenge,
  now,
  audience,
  start,
  end,
  title,
}: ChallengeStatusCardProps) {
  const t = useTranslations('admin');
  const tDomain = useTranslations('domain');
  const phase = getChallengePhase(challenge, now);
  const hint =
    challenge.status === 'draft'
      ? t('challenges.detail.draftHint')
      : challenge.status === 'archived'
        ? t('challenges.detail.archivedHint')
        : null;

  return (
    <Card as="section" aria-labelledby="challenge-status-title" className="mb-6">
      <CardBody className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2
            id="challenge-status-title"
            tabIndex={-1}
            className="rounded-sm text-xl font-semibold text-ink"
          >
            {t('challenges.detail.statusTitle')}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            <StatusChip status={challenge.status} />
            {challenge.status === 'published' && (
              <>
                <span className="sr-only">
                  {t('challenges.detail.phase', { phase: tDomain(`status.${phase}`) })}
                </span>
                <span aria-hidden="true" className="inline-flex">
                  <StatusChip status={phase} />
                </span>
              </>
            )}
          </div>
        </div>
        {hint !== null && <p className="text-sm text-ink-muted">{hint}</p>}
        <div className="flex flex-wrap gap-2">
          <ChallengeStatusButtons
            challengeId={challenge.id}
            title={title}
            status={challenge.status}
            audience={audience}
            start={start}
            end={end}
            pastDeadline={Date.parse(now) >= Date.parse(challenge.deadlineAt)}
            focusId="challenge-status-title"
            filter="all"
            size="md"
          />
          <LinkButton href={adminChallengeEntriesPath(challenge.id)} variant="secondary">
            {t('challenges.detail.viewEntries', { count: challenge.submissionCount })}
          </LinkButton>
        </div>
      </CardBody>
    </Card>
  );
}
