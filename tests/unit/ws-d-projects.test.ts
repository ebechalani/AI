import { describe, expect, it } from 'vitest';
import {
  allViewHref,
  attachmentHref,
  blockState,
  challengeBrief,
  fileSize,
  fileTypeLabel,
  groupQueueByClass,
  groupStudentSubmissions,
  latestArg,
  MAX_TRAIL,
  pageHrefs,
  parseReviewListParams,
  projectBrief,
  resubmitState,
  showsAiFeedback,
  studentOutcome,
  targetKey,
  targetOf,
} from '@/components/projects/projects-model';
import type { Submission } from '@/types';
import {
  aiReview,
  challenge,
  FILE_ID,
  project,
  schoolClass,
  submission,
} from './services-fixtures';

// The pure rules of the projects pages and the lesson block (SPEC-D 5.1): grouping, what the
// student is told, when a new version may be sent, links, and the teacher's list parameters.

function attempt(fields: Partial<Submission> & { id: string }): Submission {
  return submission(fields);
}

// --- Files -------------------------------------------------------------------------------------

describe('attachmentHref', () => {
  it('is the files route, with the submission hint and the download flag when asked', () => {
    expect(attachmentHref(FILE_ID, null)).toBe(`/api/files/${FILE_ID}`);
    expect(attachmentHref(FILE_ID, 'a b&c')).toBe(`/api/files/${FILE_ID}?submission=a+b%26c`);
    expect(attachmentHref(FILE_ID, null, { download: true })).toBe(
      `/api/files/${FILE_ID}?download=1`,
    );
    expect(attachmentHref(FILE_ID, 's_1', { download: true })).toBe(
      `/api/files/${FILE_ID}?submission=s_1&download=1`,
    );
  });
});

describe('fileSize', () => {
  it('uses kilobytes below one megabyte, one decimal, never "0 KB" for a non-empty file', () => {
    expect(fileSize(0)).toEqual({ unit: 'kilobytes', value: 0 });
    expect(fileSize(1)).toEqual({ unit: 'kilobytes', value: 0.1 });
    expect(fileSize(1536)).toEqual({ unit: 'kilobytes', value: 1.5 });
    expect(fileSize(1_048_576)).toEqual({ unit: 'megabytes', value: 1 });
    expect(fileSize(2_621_440)).toEqual({ unit: 'megabytes', value: 2.5 });
  });
});

describe('fileTypeLabel', () => {
  it('names the type by its extension, else by the content type, else not at all', () => {
    expect(fileTypeLabel('page-1.png', 'image/png')).toBe('PNG');
    expect(fileTypeLabel('game.sb3', 'application/x.scratch.sb3')).toBe('SB3');
    expect(fileTypeLabel('report', 'application/pdf')).toBe('PDF');
    expect(fileTypeLabel('notes', 'text/plain')).toBe('TXT');
    expect(fileTypeLabel('blob', 'application/octet-stream')).toBe('');
    expect(fileTypeLabel('blob', '')).toBe('');
  });
});

// --- Targets -----------------------------------------------------------------------------------

describe('targets', () => {
  it('reads the project and the challenge targets, and null when ids are missing', () => {
    expect(targetOf(attempt({ id: 's' }))).toEqual({
      context: 'project',
      courseId: 'course-1',
      projectId: 'p1',
    });
    const entry = attempt({
      id: 'e',
      context: 'challenge',
      challengeId: 'ch-1',
      courseId: null,
      projectId: null,
    });
    expect(targetOf(entry)).toEqual({ context: 'challenge', challengeId: 'ch-1' });
    expect(targetOf(attempt({ id: 'x', projectId: null }))).toBeNull();
    expect(targetOf(attempt({ id: 'y', context: 'challenge', challengeId: null }))).toBeNull();
  });

  it('keys projects and challenges apart, and a submission without a target on its own', () => {
    expect(targetKey(attempt({ id: 's' }))).toBe('p/course-1/p1');
    expect(
      targetKey(attempt({ id: 'e', context: 'challenge', challengeId: 'p1', courseId: null })),
    ).toBe('c/p1');
    expect(targetKey(attempt({ id: 'x', projectId: null }))).toBe('s/x');
  });

  it('builds getLatestSubmission’s third argument', () => {
    expect(latestArg({ context: 'project', courseId: 'c', projectId: 'p' })).toEqual({
      courseId: 'c',
      projectId: 'p',
    });
    expect(latestArg({ context: 'challenge', challengeId: 'ch' })).toEqual({ challengeId: 'ch' });
  });
});

// --- The student's list ------------------------------------------------------------------------

describe('groupStudentSubmissions', () => {
  it('puts the latest attempt by its status and older attempts under earlier', () => {
    const second = attempt({ id: 'p1-2', attemptNumber: 2, status: 'submitted' });
    const first = attempt({ id: 'p1-1', attemptNumber: 1, status: 'returned' });
    const groups = groupStudentSubmissions([second, first]);
    expect(groups.submitted).toEqual([second]);
    expect(groups.earlier).toEqual([first]);
    expect(groups.returned).toEqual([]);
  });

  it('does not mix a challenge entry with a project of the same id', () => {
    const entry = attempt({
      id: 'entry',
      context: 'challenge',
      challengeId: 'p1',
      courseId: null,
      projectId: null,
      status: 'returned',
    });
    const work = attempt({ id: 'work', status: 'returned' });
    const groups = groupStudentSubmissions([entry, work]);
    expect(groups.returned).toEqual([entry, work]);
    expect(groups.earlier).toEqual([]);
  });

  it('gathers approved and AI-reviewed work as accepted, in input order', () => {
    const a = attempt({ id: 'a', projectId: 'pa', status: 'approved' });
    const b = attempt({ id: 'b', projectId: 'pb', status: 'ai_reviewed' });
    const c = attempt({ id: 'c', projectId: 'pc', status: 'approved' });
    expect(groupStudentSubmissions([a, b, c]).accepted).toEqual([a, b, c]);
  });
});

describe('studentOutcome', () => {
  it.each(['pending', 'ready', 'failed', 'skipped'] as const)(
    'never mentions the AI to a supervised student (%s review)',
    (aiReviewStatus) => {
      expect(studentOutcome(attempt({ id: 's', classId: 'class-1', aiReviewStatus }))).toEqual({
        kind: 'waiting_teacher',
      });
    },
  );

  it('tells an unsupervised student that Robo AI is reading while pending or ready', () => {
    expect(studentOutcome(attempt({ id: 's', aiReviewStatus: 'pending' }))).toEqual({
      kind: 'ai_pending',
    });
    expect(studentOutcome(attempt({ id: 's', aiReviewStatus: 'ready' }))).toEqual({
      kind: 'ai_pending',
    });
  });

  it('counts the retries left after a failed or skipped review', () => {
    expect(
      studentOutcome(attempt({ id: 's', aiReviewStatus: 'failed', aiRegenerations: 1 })),
    ).toEqual({ kind: 'ai_unavailable', reason: 'failed', retriesLeft: 2 });
    expect(
      studentOutcome(attempt({ id: 's', aiReviewStatus: 'skipped', aiRegenerations: 3 })),
    ).toEqual({ kind: 'ai_unavailable', reason: 'skipped', retriesLeft: 0 });
  });

  it('names who closed the attempt', () => {
    expect(studentOutcome(attempt({ id: 's', status: 'approved' })).kind).toBe('approved');
    expect(studentOutcome(attempt({ id: 's', status: 'ai_reviewed' })).kind).toBe('ai_reviewed');
    expect(
      studentOutcome(attempt({ id: 's', status: 'returned', reviewedByUid: 'teacher-1' })).kind,
    ).toBe('returned_teacher');
    expect(studentOutcome(attempt({ id: 's', status: 'returned', reviewedByUid: null })).kind).toBe(
      'returned_ai',
    );
  });
});

describe('showsAiFeedback', () => {
  const ready = aiReview({ id: 'r', submissionId: 's' });

  it('shows no AI card while the attempt is still being read', () => {
    const open = attempt({ id: 's', aiReviewStatus: 'ready', status: 'submitted' });
    expect(studentOutcome(open).kind).toBe('ai_pending');
    expect(showsAiFeedback(open, ready)).toBe(false);
  });

  it('shows a ready review once the AI accepted or returned the work', () => {
    expect(showsAiFeedback(attempt({ id: 's', status: 'ai_reviewed' }), ready)).toBe(true);
    expect(showsAiFeedback(attempt({ id: 's', status: 'returned' }), ready)).toBe(true);
  });

  it('shows nothing without a ready review', () => {
    expect(showsAiFeedback(attempt({ id: 's', status: 'ai_reviewed' }), null)).toBe(false);
    expect(
      showsAiFeedback(
        attempt({ id: 's', status: 'returned' }),
        aiReview({ id: 'r', submissionId: 's', status: 'failed' }),
      ),
    ).toBe(false);
  });
});

describe('resubmitState', () => {
  const returned = attempt({ id: 'r1', status: 'returned', attemptNumber: 2 });
  const base = {
    submission: returned,
    latestId: 'r1',
    definitionAvailable: true,
    challengeOpen: null,
  };

  it('allows a new version of the latest returned attempt', () => {
    expect(resubmitState(base)).toBe('allowed');
    expect(resubmitState({ ...base, latestId: null })).toBe('allowed');
  });

  it('applies the rules in order', () => {
    expect(
      resubmitState({
        ...base,
        submission: { ...returned, status: 'approved' },
        latestId: 'other',
      }),
    ).toBe('not_returned');
    expect(resubmitState({ ...base, latestId: 'other', definitionAvailable: false })).toBe(
      'not_latest',
    );
    expect(
      resubmitState({
        ...base,
        submission: { ...returned, attemptNumber: 10 },
        challengeOpen: false,
      }),
    ).toBe('no_attempts');
    expect(resubmitState({ ...base, challengeOpen: false, definitionAvailable: false })).toBe(
      'closed',
    );
    expect(resubmitState({ ...base, definitionAvailable: false })).toBe('unavailable');
  });
});

describe('blockState', () => {
  it('covers the five states of the lesson block', () => {
    const latest = attempt({ id: 's' });
    expect(blockState(latest, true)).toBe('preview');
    expect(blockState(null, false)).toBe('submit');
    expect(blockState({ ...latest, status: 'returned', attemptNumber: 9 }, false)).toBe('resubmit');
    expect(blockState({ ...latest, status: 'returned', attemptNumber: 10 }, false)).toBe(
      'no_attempts',
    );
    expect(blockState(latest, false)).toBe('status_only');
    expect(blockState({ ...latest, status: 'approved' }, false)).toBe('status_only');
  });
});

describe('briefs', () => {
  it('reads a project’s brief in the locale, falling back to its default', () => {
    const p = project({ id: 'p1', courseId: 'c' });
    expect(projectBrief(p, 'fr')).toEqual({
      title: 'Project p1',
      brief: 'Build it',
      requirements: 'Explain it',
    });
  });

  it('reads a challenge’s description and requirements', () => {
    expect(challengeBrief(challenge({ id: 'ch' }), 'en')).toEqual({
      title: 'Challenge ch',
      brief: 'Do something',
      requirements: 'Show it',
    });
  });
});

// --- The teacher's lists -----------------------------------------------------------------------

describe('groupQueueByClass', () => {
  const alpha = schoolClass({ id: 'alpha', name: 'Alpha' });
  const beta = schoolClass({ id: 'beta', name: 'Beta', archived: true });
  const gamma = schoolClass({ id: 'gamma', name: 'Gamma' });

  it('groups by class in class order, keeps the queue order and puts unknown classes last', () => {
    const q = [
      attempt({ id: '1', classId: 'beta' }),
      attempt({ id: '2', classId: 'stranger' }),
      attempt({ id: '3', classId: 'alpha' }),
      attempt({ id: '4', classId: 'beta' }),
    ];
    const groups = groupQueueByClass(q, [alpha, beta, gamma]);
    expect(groups.map((g) => [g.classId, g.name, g.archived, g.items.map((s) => s.id)])).toEqual([
      ['alpha', 'Alpha', false, ['3']],
      ['beta', 'Beta', true, ['1', '4']],
      ['stranger', null, false, ['2']],
    ]);
  });

  it('is empty for an empty queue', () => {
    expect(groupQueueByClass([], [alpha])).toEqual([]);
  });
});

describe('parseReviewListParams', () => {
  const archived = schoolClass({ id: 'old', name: 'Old', archived: true });
  const current = schoolClass({ id: 'now', name: 'Now' });
  const classes = [archived, current];

  it('defaults to the queue and the first class that is not archived', () => {
    expect(parseReviewListParams({}, classes)).toEqual({
      view: 'queue',
      classId: 'now',
      trail: [],
      staleLink: false,
    });
  });

  it('takes a class the teacher teaches, ignores one they do not', () => {
    expect(parseReviewListParams({ view: 'all', class: 'old' }, classes).classId).toBe('old');
    expect(parseReviewListParams({ view: 'all', class: 'theirs' }, classes).classId).toBe('now');
    expect(
      parseReviewListParams({ view: ['all', 'queue'], class: ['old'] }, classes),
    ).toMatchObject({ view: 'all', classId: 'old' });
  });

  it('falls back to an archived class, then to none', () => {
    expect(parseReviewListParams({}, [archived]).classId).toBe('old');
    expect(parseReviewListParams({}, []).classId).toBeNull();
  });

  it('reads the trail of cursors and marks a bad or too long one as stale', () => {
    expect(parseReviewListParams({ cursors: 'a_1.b_2' }, classes).trail).toEqual(['a_1', 'b_2']);
    expect(parseReviewListParams({ cursors: 'zz z' }, classes)).toMatchObject({
      trail: [],
      staleLink: true,
    });
    const long = Array.from({ length: MAX_TRAIL + 1 }, (_, i) => `c${i}`).join('.');
    expect(parseReviewListParams({ cursors: long }, classes)).toMatchObject({
      trail: [],
      staleLink: true,
    });
  });
});

describe('All view links', () => {
  it('builds the All view of a class at a page', () => {
    expect(allViewHref('c1', [])).toBe('/teacher/projects?view=all&class=c1');
    expect(allViewHref('c1', ['a', 'b'])).toBe('/teacher/projects?view=all&class=c1&cursors=a.b');
  });

  it('has no previous page on page 1 and goes back one cursor after', () => {
    expect(pageHrefs('c1', [], 'n1')).toEqual({
      previousHref: null,
      nextHref: '/teacher/projects?view=all&class=c1&cursors=n1',
      page: 1,
    });
    expect(pageHrefs('c1', ['a', 'b'], null)).toEqual({
      previousHref: '/teacher/projects?view=all&class=c1&cursors=a',
      nextHref: null,
      page: 3,
    });
  });

  it('stops offering a next page at the trail limit', () => {
    const full = Array.from({ length: MAX_TRAIL }, (_, i) => `c${i}`);
    expect(pageHrefs('c1', full, 'more').nextHref).toBeNull();
  });
});
