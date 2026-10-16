import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ProjectCard, useDateFormat } from '@/components/domain';
import { SubmissionForm } from '@/components/projects/SubmissionForm';
import { Alert, LinkButton } from '@/components/ui';
import { SUBMISSION_LIMITS } from '@/lib/limits';
import type { SubmissionType } from '@/types/common';
import type { Submission } from '@/types/project';
import { entryFocusKey, type ChallengeEntryState } from './challenges-model';
import { CheckAgainButton } from './CheckAgainButton';
import { EntryHeading } from './EntryHeading';

function EntryCard({ entry }: { entry: Submission }) {
  return (
    <div className="sm:max-w-md">
      <ProjectCard submission={entry} href={entryHref(entry)} />
    </div>
  );
}

function entryHref(entry: Submission): string {
  return `/student/projects/${entry.id}`;
}

/**
 * For what only the entry page finishes (9.4): it adds the XP of an entry whose acceptance was
 * interrupted, and starts again an AI review that never came. Checking this page again would
 * never change either.
 */
function OpenEntryLink({ entry, label }: { entry: Submission; label: string }) {
  return (
    <LinkButton href={entryHref(entry)} variant="secondary" size="sm">
      {label}
      <ArrowRight aria-hidden="true" className="rtl:rotate-180" />
    </LinkButton>
  );
}

function FormHeading({ children }: { children: string }) {
  return <h3 className="text-base font-semibold text-ink">{children}</h3>;
}

export interface ChallengeEntryPanelProps {
  challengeId: string;
  state: ChallengeEntryState;
  allowedTypes: SubmissionType[];
}

/** The student's entry: what happened to it, and the form when one can be sent (6.4). */
export function ChallengeEntryPanel({
  challengeId,
  state,
  allowedTypes,
}: ChallengeEntryPanelProps) {
  const t = useTranslations('challenges');
  const formatDate = useDateFormat();
  const target = { context: 'challenge', challengeId } as const;
  const canSend = allowedTypes.length > 0;

  let body;
  switch (state.kind) {
    case 'accepted': {
      const { latest } = state;
      const approved = latest.status === 'approved';
      // Accepted, but the XP is not added yet: the run that accepted it stopped before, and only
      // the entry page finishes it (9.4). Usually gone before anyone sees it.
      const xpPending = !latest.effectsApplied;
      body = (
        <>
          <Alert
            tone="success"
            title={t(approved ? 'entry.approved.title' : 'entry.accepted.title')}
            action={
              xpPending ? <OpenEntryLink entry={latest} label={t('entry.openEntry')} /> : undefined
            }
          >
            <p>{t(approved ? 'entry.approved.description' : 'entry.accepted.description')}</p>
            {xpPending ? (
              <p>{t('entry.accepted.xpPending')}</p>
            ) : (
              latest.xpAwarded > 0 && (
                <p className="font-semibold">{t('entry.accepted.xp', { xp: latest.xpAwarded })}</p>
              )
            )}
          </Alert>
          <EntryCard entry={latest} />
        </>
      );
      break;
    }
    case 'waiting': {
      const { latest, needsRetry, stalled } = state;
      const sent = t('entry.waiting.description', {
        date: formatDate(latest.submittedAt, 'dateTime'),
      });
      body = (
        <>
          {needsRetry ? (
            <Alert tone="warning" title={t('entry.waiting.title')}>
              {t('entry.waiting.reviewFailed')}
            </Alert>
          ) : stalled ? (
            <Alert
              tone="info"
              title={t('entry.waiting.title')}
              action={<OpenEntryLink entry={latest} label={t('entry.openEntry')} />}
            >
              <p>{sent}</p>
              <p>{t('entry.waiting.stalled')}</p>
            </Alert>
          ) : (
            // live off: the button's own status line announces each check (no nested regions).
            // Keyed, so a check that changes the panel always unmounts it and the heading takes
            // the focus, whichever state comes next.
            <Alert
              tone="info"
              live="off"
              title={t('entry.waiting.title')}
              action={
                <CheckAgainButton
                  key="waiting"
                  stillPendingLabel={t('entry.waiting.stillWaiting')}
                />
              }
            >
              {sent}
            </Alert>
          )}
          <EntryCard entry={latest} />
        </>
      );
      break;
    }
    case 'not_open_yet':
      body = (
        <Alert tone="info" live="off">
          {t('entry.notOpenYet', { date: formatDate(state.startAt, 'dateTime') })}
        </Alert>
      );
      break;
    case 'closed':
      body = (
        <>
          <Alert tone="info" live="off">
            {t('entry.closed', { date: formatDate(state.deadlineAt, 'dateTime') })}
          </Alert>
          {state.latest && <EntryCard entry={state.latest} />}
        </>
      );
      break;
    case 'can_enter':
      body = canSend ? (
        <>
          <FormHeading>{t('entry.send')}</FormHeading>
          <SubmissionForm target={target} allowedTypes={allowedTypes} />
        </>
      ) : (
        <Alert tone="info" live="off">
          {t('entry.unavailable')}
        </Alert>
      );
      break;
    case 'can_resubmit': {
      const { latest, attemptsLeft } = state;
      body = (
        <>
          <Alert tone="warning" live="off" title={t('entry.returned.title')}>
            <p>{t('entry.returned.description')}</p>
            <p className="font-semibold">
              {t('entry.returned.attemptsLeft', { count: attemptsLeft })}
            </p>
          </Alert>
          <EntryCard entry={latest} />
          {canSend ? (
            <>
              <FormHeading>{t('entry.newVersion')}</FormHeading>
              <SubmissionForm
                target={target}
                allowedTypes={allowedTypes}
                previousSubmissionId={latest.id}
              />
            </>
          ) : (
            <Alert tone="info" live="off">
              {t('entry.unavailable')}
            </Alert>
          )}
        </>
      );
      break;
    }
    case 'no_attempts_left':
      body = (
        <>
          <Alert tone="warning" live="off" title={t('entry.noAttempts.title')}>
            {t('entry.noAttempts.description', { max: SUBMISSION_LIMITS.maxAttempts })}
          </Alert>
          <EntryCard entry={state.latest} />
        </>
      );
      break;
  }

  return (
    <section
      id="challenge-entry"
      aria-labelledby="challenge-entry-title"
      className="flex min-w-0 flex-col gap-4"
    >
      {/* Focusable from script only: it takes focus back when the panel changes after a refresh
          (an entry sent, a check that changed the state). */}
      <EntryHeading focusKey={entryFocusKey(state)}>{t('entry.title')}</EntryHeading>
      {body}
    </section>
  );
}
