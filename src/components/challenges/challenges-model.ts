import { pickTranslation } from '@/lib/i18n/content';
import { getChallengePhase } from '@/lib/learning/challenge-phase';
import { AI_LIMITS, SUBMISSION_LIMITS } from '@/lib/limits';
import type { Challenge, ChallengePhase } from '@/types/challenge';
import type { IsoDateString } from '@/types/common';
import { RUBRIC_KEYS, type RubricWeight, type Submission } from '@/types/project';

// The Challenge Arena and a challenge's entry panel as plain data (ARCHITECTURE.md 3.4
// "Gamification, challenges", 3.7 "Student Challenges", 6.4).

export interface ArenaGroups {
  open: Challenge[];
  upcoming: Challenge[];
  closed: Challenge[];
}

function time(value: IsoDateString): number {
  return Date.parse(value);
}

/** open: soonest deadline first; upcoming: soonest start first; closed: latest deadline first. */
export function groupByPhase(
  challenges: readonly Challenge[],
  now: Date | IsoDateString,
): ArenaGroups {
  const groups: ArenaGroups = { open: [], upcoming: [], closed: [] };
  for (const challenge of challenges) groups[getChallengePhase(challenge, now)].push(challenge);
  groups.open.sort((a, b) => time(a.deadlineAt) - time(b.deadlineAt));
  groups.upcoming.sort((a, b) => time(a.startAt) - time(b.startAt));
  groups.closed.sort((a, b) => time(b.deadlineAt) - time(a.deadlineAt));
  return groups;
}

/** The challenges the student has sent at least one entry to. */
export function enteredChallengeIds(entries: readonly Submission[]): Set<string> {
  const ids = new Set<string>();
  for (const entry of entries) {
    if (entry.context === 'challenge' && entry.challengeId !== null) ids.add(entry.challengeId);
  }
  return ids;
}

/** One entry per challenge, its highest attemptNumber; newest submittedAt first. */
export function latestEntries(entries: readonly Submission[]): Submission[] {
  const latest = new Map<string, Submission>();
  for (const entry of entries) {
    if (entry.context !== 'challenge' || entry.challengeId === null) continue;
    const kept = latest.get(entry.challengeId);
    if (kept === undefined || entry.attemptNumber > kept.attemptNumber) {
      latest.set(entry.challengeId, entry);
    }
  }
  return [...latest.values()].sort((a, b) => time(b.submittedAt) - time(a.submittedAt));
}

export function attemptsLeft(latest: Pick<Submission, 'attemptNumber'>): number {
  return Math.max(0, SUBMISSION_LIMITS.maxAttempts - latest.attemptNumber);
}

export type ChallengeEntryState =
  /** latest.status 'approved' | 'ai_reviewed', in any phase. */
  | { kind: 'accepted'; latest: Submission }
  /** Phase 'upcoming'. */
  | { kind: 'not_open_yet'; startAt: IsoDateString }
  /**
   * latest.status 'submitted', in any phase. `needsRetry`: an unsupervised entry whose AI review
   * failed or was skipped stays submitted until its owner asks again (3.4 state machine).
   * `stalled`: an unsupervised entry whose AI review is still 'pending' after
   * AI_LIMITS.reviewRetriggerAfterMs; only the entry page (getSubmissionForViewer) starts it
   * again (9.4), so checking this page again would never change it.
   */
  | { kind: 'waiting'; latest: Submission; needsRetry: boolean; stalled: boolean }
  /** Phase 'closed', with the entry that was returned, if any. */
  | { kind: 'closed'; deadlineAt: IsoDateString; latest: Submission | null }
  /** Open, no entry yet. */
  | { kind: 'can_enter' }
  /** Open, returned, attempts left. */
  | { kind: 'can_resubmit'; latest: Submission; attemptsLeft: number }
  /** Open, returned, every attempt used. */
  | { kind: 'no_attempts_left'; latest: Submission };

/** Rules in this order: accepted → upcoming → waiting → closed → none → returned. */
export function challengeEntryState(
  challenge: Pick<Challenge, 'startAt' | 'deadlineAt'>,
  phase: ChallengePhase,
  latest: Submission | null,
  now: Date | IsoDateString,
): ChallengeEntryState {
  if (latest !== null && (latest.status === 'approved' || latest.status === 'ai_reviewed')) {
    return { kind: 'accepted', latest };
  }
  if (phase === 'upcoming') return { kind: 'not_open_yet', startAt: challenge.startAt };
  if (latest !== null && latest.status === 'submitted') {
    const unsupervised = latest.classId === null;
    const needsRetry =
      unsupervised && (latest.aiReviewStatus === 'failed' || latest.aiReviewStatus === 'skipped');
    const nowMs = typeof now === 'string' ? Date.parse(now) : now.getTime();
    const stalled =
      unsupervised &&
      latest.aiReviewStatus === 'pending' &&
      nowMs - time(latest.submittedAt) > AI_LIMITS.reviewRetriggerAfterMs;
    return { kind: 'waiting', latest, needsRetry, stalled };
  }
  if (phase === 'closed') return { kind: 'closed', deadlineAt: challenge.deadlineAt, latest };
  if (latest === null) return { kind: 'can_enter' };
  const left = attemptsLeft(latest);
  return left > 0
    ? { kind: 'can_resubmit', latest, attemptsLeft: left }
    : { kind: 'no_attempts_left', latest };
}

/**
 * Names what the entry panel shows. It changes whenever the panel's content changes (a new
 * entry, a review, a failed or stalled review, the XP added), and only then: EntryHeading takes
 * focus back when it changes and focus was lost (sending an entry unmounts the form).
 */
export function entryFocusKey(state: ChallengeEntryState): string {
  switch (state.kind) {
    case 'waiting': {
      const review = state.needsRetry ? 'retry' : state.stalled ? 'stalled' : 'pending';
      return `waiting:${state.latest.id}:${review}`;
    }
    case 'accepted': {
      const xp = state.latest.effectsApplied ? 'xp' : 'xp-pending';
      return `accepted:${state.latest.id}:${state.latest.status}:${xp}`;
    }
    case 'closed':
      return `closed:${state.latest?.id ?? ''}`;
    case 'can_resubmit':
    case 'no_attempts_left':
      return `${state.kind}:${state.latest.id}`;
    case 'not_open_yet':
    case 'can_enter':
      return state.kind;
  }
}

/** Weights above 0, heaviest first, ties in RUBRIC_KEYS order. */
export function rubricRows(rubric: readonly RubricWeight[]): RubricWeight[] {
  return rubric
    .filter((row) => row.weight > 0)
    .sort((a, b) => b.weight - a.weight || RUBRIC_KEYS.indexOf(a.key) - RUBRIC_KEYS.indexOf(b.key));
}

export interface ChallengeText {
  title: string;
  description: string;
  requirements: string;
  prizes: string | null;
}

/** pickTranslation per field; blank prizes → null; undefined fields → ''. */
export function challengeText(
  challenge: Pick<Challenge, 'translations' | 'defaultLocale'>,
  locale: string,
): ChallengeText {
  const text = pickTranslation(challenge.translations, locale, challenge.defaultLocale);
  const prizes = typeof text.prizes === 'string' && text.prizes.trim() !== '' ? text.prizes : null;
  return {
    title: text.title ?? '',
    description: text.description ?? '',
    requirements: text.submissionRequirements ?? '',
    prizes,
  };
}
