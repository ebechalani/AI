import { useLocale, useTranslations } from 'next-intl';
import { StatusChip, useDateFormat } from '@/components/domain';
import {
  LinkButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui';
import { Link } from '@/lib/i18n/navigation';
import { getChallengePhase } from '@/lib/learning/challenge-phase';
import type { Challenge } from '@/types/challenge';
import type { IsoDateString } from '@/types/common';
import { challengeTitle, type StatusFilter } from './challenge-model';
import { ChallengeStatusButtons } from './ChallengeStatusButtons';
import { adminChallengeEntriesPath, adminChallengePath } from './paths';

export interface ChallengesTableProps {
  challenges: Challenge[];
  schoolNames: Record<string, string>;
  now: IsoDateString;
  /** The list's status filter: decides where the focus lands when a change hides the row. */
  filter: StatusFilter;
}

const LINK_CLASSES =
  'rounded-sm text-brand-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

/** Challenges with their audience, state, dates, entries, an Edit link and the status buttons. */
export function ChallengesTable({ challenges, schoolNames, now, filter }: ChallengesTableProps) {
  const t = useTranslations('admin');
  const tDomain = useTranslations('domain');
  const locale = useLocale();
  const formatDate = useDateFormat();

  return (
    <Table caption={t('challenges.caption')}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t('challenges.columns.challenge')}</TableHeaderCell>
          <TableHeaderCell>{t('challenges.columns.audience')}</TableHeaderCell>
          <TableHeaderCell>{t('challenges.columns.status')}</TableHeaderCell>
          <TableHeaderCell>{t('challenges.columns.dates')}</TableHeaderCell>
          <TableHeaderCell>{t('challenges.columns.entries')}</TableHeaderCell>
          <TableHeaderCell align="end">{t('challenges.columns.actions')}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {challenges.map((challenge) => {
          const title = challengeTitle(challenge, locale) ?? t('challenges.untitled');
          const school =
            challenge.schoolId === null
              ? null
              : (schoolNames[challenge.schoolId] ?? t('shared.unknownSchool'));
          const audience =
            challenge.scope === 'school' && school !== null
              ? t('challenges.transitions.audienceSchool', { school })
              : t('challenges.transitions.audienceEveryone');
          const start = formatDate(challenge.startAt, 'dateTime');
          const end = formatDate(challenge.deadlineAt, 'dateTime');
          const focusId = `challenge-title-${challenge.id}`;
          return (
            <TableRow key={challenge.id}>
              <TableHeaderCell scope="row" wrap className="min-w-48 font-normal">
                <Link
                  id={focusId}
                  href={adminChallengePath(challenge.id)}
                  className="rounded-sm font-medium break-words text-ink underline-offset-4 hover:text-brand-700 hover:underline"
                >
                  {title}
                </Link>
                <span className="block text-sm text-ink-muted">
                  {tDomain(`challenge.types.${challenge.type}`)}
                  <span aria-hidden="true"> · </span>
                  {tDomain(`areas.${challenge.area}`)}
                </span>
              </TableHeaderCell>
              <TableCell className="min-w-40 whitespace-normal">
                {challenge.scope === 'school' && school !== null
                  ? t('challenges.schoolOnly', { school })
                  : t('challenges.everyone')}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1.5">
                  <StatusChip status={challenge.status} />
                  {challenge.status === 'published' && (
                    <StatusChip status={getChallengePhase(challenge, now)} />
                  )}
                </div>
              </TableCell>
              <TableCell className="min-w-48 whitespace-normal">
                {t('shared.dateRange', { start, end })}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <Link
                  href={adminChallengeEntriesPath(challenge.id)}
                  aria-label={t('challenges.entriesLabel', { title })}
                  className={LINK_CLASSES}
                >
                  {t('challenges.entriesLink', { count: challenge.submissionCount })}
                </Link>
              </TableCell>
              <TableCell align="end">
                <div className="flex flex-wrap justify-end gap-2">
                  <LinkButton
                    href={adminChallengePath(challenge.id)}
                    variant="ghost"
                    size="sm"
                    aria-label={t('challenges.editLabel', { title })}
                  >
                    {t('challenges.edit')}
                  </LinkButton>
                  <ChallengeStatusButtons
                    challengeId={challenge.id}
                    title={title}
                    status={challenge.status}
                    audience={audience}
                    start={start}
                    end={end}
                    pastDeadline={Date.parse(now) >= Date.parse(challenge.deadlineAt)}
                    focusId={focusId}
                    filter={filter}
                  />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
