import { describe, expect, it } from 'vitest';
import {
  attemptsLeft,
  challengeEntryState,
  challengeText,
  enteredChallengeIds,
  entryFocusKey,
  groupByPhase,
  latestEntries,
  rubricRows,
} from '@/components/challenges/challenges-model';
import type { ChallengePhase, Submission } from '@/types';
import { AI_LIMITS } from '@/lib/limits';
import { challenge, NOW, submission } from './services-fixtures';

// The Challenge Arena's pure model (ARCHITECTURE.md 3.4, 3.7 "Student Challenges", 6.4).

const ids = (items: readonly { id: string }[]) => items.map((item) => item.id);

const START = '2026-10-10T00:00:00.000Z';
const DEADLINE = '2026-10-20T00:00:00.000Z';

function entry(id: string, fields: Partial<Submission> = {}): Submission {
  return submission({
    id,
    context: 'challenge',
    courseId: null,
    lessonId: null,
    projectId: null,
    challengeId: 'c1',
    ...fields,
  });
}

describe('groupByPhase', () => {
  it('puts the start in open and the deadline in closed', () => {
    const one = challenge({ id: 'one', startAt: START, deadlineAt: DEADLINE });
    expect(ids(groupByPhase([one], START).open)).toEqual(['one']);
    expect(ids(groupByPhase([one], DEADLINE).closed)).toEqual(['one']);
    expect(ids(groupByPhase([one], '2026-10-09T23:59:59.999Z').upcoming)).toEqual(['one']);
  });

  it('sorts each group', () => {
    const now = '2026-10-15T00:00:00.000Z';
    const groups = groupByPhase(
      [
        challenge({ id: 'open-late', startAt: START, deadlineAt: '2026-10-30T00:00:00.000Z' }),
        challenge({ id: 'open-soon', startAt: START, deadlineAt: '2026-10-16T00:00:00.000Z' }),
        challenge({
          id: 'up-late',
          startAt: '2026-11-10T00:00:00.000Z',
          deadlineAt: '2026-11-11T00:00:00.000Z',
        }),
        challenge({
          id: 'up-soon',
          startAt: '2026-10-20T00:00:00.000Z',
          deadlineAt: '2026-12-01T00:00:00.000Z',
        }),
        challenge({
          id: 'closed-old',
          startAt: '2026-09-01T00:00:00.000Z',
          deadlineAt: '2026-09-02T00:00:00.000Z',
        }),
        challenge({
          id: 'closed-new',
          startAt: '2026-10-01T00:00:00.000Z',
          deadlineAt: '2026-10-02T00:00:00.000Z',
        }),
      ],
      now,
    );
    expect(ids(groups.open)).toEqual(['open-soon', 'open-late']);
    expect(ids(groups.upcoming)).toEqual(['up-soon', 'up-late']);
    expect(ids(groups.closed)).toEqual(['closed-new', 'closed-old']);
  });
});

describe('enteredChallengeIds', () => {
  it('ignores project work and entries without a challenge', () => {
    const entered = enteredChallengeIds([
      entry('e1', { challengeId: 'c1' }),
      entry('e2', { challengeId: 'c2' }),
      entry('e3', { challengeId: null }),
      submission({ id: 'p1' }),
    ]);
    expect([...entered].sort()).toEqual(['c1', 'c2']);
  });
});

describe('latestEntries', () => {
  it('keeps the highest attempt per challenge, newest first', () => {
    const list = latestEntries([
      entry('c1-1', { challengeId: 'c1', attemptNumber: 1, submittedAt: '2026-10-11T00:00:00Z' }),
      entry('c2-1', { challengeId: 'c2', attemptNumber: 1, submittedAt: '2026-10-12T00:00:00Z' }),
      entry('c1-2', { challengeId: 'c1', attemptNumber: 2, submittedAt: '2026-10-13T00:00:00Z' }),
      submission({ id: 'project' }),
    ]);
    expect(ids(list)).toEqual(['c1-2', 'c2-1']);
  });
});

describe('challengeEntryState', () => {
  const target = { startAt: START, deadlineAt: DEADLINE };
  // The fixtures' entries are sent at NOW: a moment later, no review is late yet.
  const soon = new Date(Date.parse(NOW) + 1000).toISOString();
  const state = (phase: ChallengePhase, latest: Submission | null, now = soon) =>
    challengeEntryState(target, phase, latest, now);

  it('derives every state', () => {
    expect(state('upcoming', null)).toEqual({ kind: 'not_open_yet', startAt: START });
    expect(state('open', null)).toEqual({ kind: 'can_enter' });
    expect(state('closed', null)).toEqual({ kind: 'closed', deadlineAt: DEADLINE, latest: null });

    const sent = entry('e', { status: 'submitted', aiReviewStatus: 'pending' });
    expect(state('open', sent)).toEqual({
      kind: 'waiting',
      latest: sent,
      needsRetry: false,
      stalled: false,
    });
    expect(state('closed', sent)).toEqual({
      kind: 'waiting',
      latest: sent,
      needsRetry: false,
      stalled: false,
    });

    const reviewed = entry('e', { status: 'ai_reviewed' });
    expect(state('open', reviewed)).toEqual({ kind: 'accepted', latest: reviewed });
    const approved = entry('e', { status: 'approved' });
    expect(state('closed', approved)).toEqual({ kind: 'accepted', latest: approved });

    const returned = entry('e', { status: 'returned', attemptNumber: 1 });
    expect(state('open', returned)).toEqual({
      kind: 'can_resubmit',
      latest: returned,
      attemptsLeft: 9,
    });
    const last = entry('e', { status: 'returned', attemptNumber: 10 });
    expect(state('open', last)).toEqual({ kind: 'no_attempts_left', latest: last });
    expect(state('closed', returned)).toEqual({
      kind: 'closed',
      deadlineAt: DEADLINE,
      latest: returned,
    });
  });

  it('asks the owner to retry an unsupervised entry whose AI review will not come', () => {
    for (const aiReviewStatus of ['failed', 'skipped'] as const) {
      const stuck = entry('e', { status: 'submitted', classId: null, aiReviewStatus });
      expect(state('open', stuck)).toEqual({
        kind: 'waiting',
        latest: stuck,
        needsRetry: true,
        stalled: false,
      });
    }
    // A class entry waits for its teacher, whatever the AI did.
    const supervised = entry('e', { status: 'submitted', classId: 'c1', aiReviewStatus: 'failed' });
    expect(state('open', supervised)).toEqual({
      kind: 'waiting',
      latest: supervised,
      needsRetry: false,
      stalled: false,
    });
  });

  it('sends the owner to the entry when its AI review is late (only that page starts it again)', () => {
    const at = (ms: number) => new Date(Date.parse(NOW) + ms).toISOString();
    const limit = AI_LIMITS.reviewRetriggerAfterMs;
    const sent = entry('e', { status: 'submitted', classId: null, aiReviewStatus: 'pending' });
    expect(state('open', sent, at(limit))).toMatchObject({ kind: 'waiting', stalled: false });
    expect(state('open', sent, at(limit + 1))).toMatchObject({ kind: 'waiting', stalled: true });
    expect(challengeEntryState(target, 'closed', sent, new Date(at(limit + 1)))).toMatchObject({
      kind: 'waiting',
      stalled: true,
    });
    // A ready review is about to change the status; a class entry waits for its teacher.
    const ready = entry('e', { status: 'submitted', classId: null, aiReviewStatus: 'ready' });
    expect(state('open', ready, at(limit * 5))).toMatchObject({ stalled: false });
    const supervised = entry('e', {
      status: 'submitted',
      classId: 'c1',
      aiReviewStatus: 'pending',
    });
    expect(state('open', supervised, at(limit * 5))).toMatchObject({ stalled: false });
  });

  it('counts the attempts left', () => {
    expect(attemptsLeft({ attemptNumber: 3 })).toBe(7);
    expect(attemptsLeft({ attemptNumber: 12 })).toBe(0);
  });
});

describe('entryFocusKey', () => {
  const sent = entry('e1', { status: 'submitted', classId: null, aiReviewStatus: 'pending' });
  const waiting = { kind: 'waiting', latest: sent, needsRetry: false, stalled: false } as const;

  it('changes when the panel changes', () => {
    const keys = [
      entryFocusKey({ kind: 'can_enter' }),
      entryFocusKey({ kind: 'not_open_yet', startAt: START }),
      entryFocusKey(waiting),
      entryFocusKey({ ...waiting, needsRetry: true }),
      entryFocusKey({ ...waiting, stalled: true }),
      entryFocusKey({ kind: 'accepted', latest: entry('e1', { status: 'ai_reviewed' }) }),
      entryFocusKey({
        kind: 'accepted',
        latest: entry('e1', { status: 'ai_reviewed', effectsApplied: false }),
      }),
      entryFocusKey({ kind: 'accepted', latest: entry('e1', { status: 'approved' }) }),
      entryFocusKey({
        kind: 'can_resubmit',
        latest: entry('e1', { status: 'returned' }),
        attemptsLeft: 9,
      }),
      entryFocusKey({
        kind: 'can_resubmit',
        latest: entry('e2', { status: 'returned' }),
        attemptsLeft: 8,
      }),
      entryFocusKey({ kind: 'no_attempts_left', latest: entry('e2', { status: 'returned' }) }),
      entryFocusKey({ kind: 'closed', deadlineAt: DEADLINE, latest: null }),
      entryFocusKey({ kind: 'closed', deadlineAt: DEADLINE, latest: sent }),
    ];
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('stays the same when a check changes nothing', () => {
    expect(entryFocusKey(waiting)).toBe(entryFocusKey({ ...waiting, latest: { ...sent } }));
    expect(entryFocusKey({ kind: 'can_enter' })).toBe('can_enter');
  });
});

describe('rubricRows', () => {
  it('drops zero weights, heaviest first, ties in rubric order', () => {
    expect(
      rubricRows([
        { key: 'responsibleAi', weight: 20 },
        { key: 'understanding', weight: 0 },
        { key: 'technicalQuality', weight: 20 },
        { key: 'creativity', weight: 60 },
      ]),
    ).toEqual([
      { key: 'creativity', weight: 60 },
      { key: 'technicalQuality', weight: 20 },
      { key: 'responsibleAi', weight: 20 },
    ]);
  });
});

describe('challengeText', () => {
  it('falls back per field to the default locale and turns blank prizes into null', () => {
    const target = challenge({
      id: 'c',
      defaultLocale: 'en',
      translations: {
        en: {
          title: 'Robots',
          description: 'Build one',
          submissionRequirements: 'A video',
          prizes: 'A kit',
        },
        fr: { title: 'Robots FR', description: '', submissionRequirements: '', prizes: '  ' },
      },
    });
    expect(challengeText(target, 'fr')).toEqual({
      title: 'Robots FR',
      description: 'Build one',
      requirements: 'A video',
      prizes: 'A kit',
    });
    const noPrizes = challenge({
      id: 'd',
      translations: {
        en: { title: 'T', description: 'D', submissionRequirements: 'R', prizes: '   ' },
      },
    });
    expect(challengeText(noPrizes, 'en').prizes).toBeNull();
  });
});
