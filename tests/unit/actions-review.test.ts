import { beforeEach, describe, expect, it, vi } from 'vitest';
import { regenerateAiReviewAction, reviewSubmissionAction } from '@/actions/review';
import { assertSessionNotRevoked, getSession } from '@/lib/actions/session-source';
import { ConflictError } from '@/lib/errors';
import { regenerateAiReview, reviewSubmission } from '@/lib/services/project-flow';
import type { ReviewInput, Role } from '@/types';
import { session as sessionOf, submission } from './services-fixtures';

// The review actions (ARCHITECTURE.md 10.4, 8.4): teachers and platform admins decide; the
// owner of unsupervised work, a teacher or a platform admin may ask for a new AI review.

vi.mock('next-intl/server', () => ({ getLocale: vi.fn(() => Promise.resolve('en')) }));
vi.mock('@/lib/actions/session-source', () => ({
  getSession: vi.fn(),
  assertSessionNotRevoked: vi.fn(),
}));
vi.mock('@/lib/services/project-flow', () => ({
  reviewSubmission: vi.fn(),
  regenerateAiReview: vi.fn(),
}));

const ID = 'student-1_p_course-1_p1_1';

const approve: ReviewInput = {
  submissionId: ID,
  decision: 'approve',
  criteria: null,
  feedback: 'Well done.',
};

function signIn(role: Role | null): void {
  vi.mocked(getSession).mockResolvedValue(role === null ? null : sessionOf(role, `${role}-1`));
}

beforeEach(() => {
  vi.mocked(reviewSubmission)
    .mockReset()
    .mockResolvedValue({
      submission: submission({ id: ID, status: 'approved' }),
      gamification: null,
    });
  vi.mocked(regenerateAiReview).mockReset().mockResolvedValue(undefined);
  vi.mocked(getSession).mockReset();
  vi.mocked(assertSessionNotRevoked).mockReset().mockResolvedValue(undefined);
  signIn('teacher');
});

describe('reviewSubmissionAction', () => {
  it.each<Role>(['teacher', 'platform_admin'])(
    'lets a %s decide and answers the new status',
    async (role) => {
      signIn(role);
      expect(await reviewSubmissionAction(approve)).toEqual({
        ok: true,
        data: { status: 'approved' },
      });
      expect(reviewSubmission).toHaveBeenCalledWith(sessionOf(role, `${role}-1`), approve);
    },
  );

  it.each<Role>(['student', 'school_admin'])('refuses a %s', async (role) => {
    signIn(role);
    expect(await reviewSubmissionAction(approve)).toEqual({
      ok: false,
      error: { code: 'forbidden' },
    });
    expect(reviewSubmission).not.toHaveBeenCalled();
  });

  it('requires the scores with modify, and refuses them with the other decisions', async () => {
    expect(await reviewSubmissionAction({ ...approve, decision: 'modify' })).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { criteria: ['required'] } },
    });
    const criteria = { creativity: 1, technicalQuality: 2, understanding: 3, responsibleAi: 4 };
    expect(await reviewSubmissionAction({ ...approve, criteria })).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { criteria: ['invalid'] } },
    });
    expect(reviewSubmission).not.toHaveBeenCalled();
  });

  it('refuses blank feedback', async () => {
    const result = await reviewSubmissionAction({ ...approve, feedback: '   ' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('validation');
    expect(result.error.fieldErrors?.feedback).toEqual(['required']);
    expect(reviewSubmission).not.toHaveBeenCalled();
  });

  it('answers a conflict (reviewed meanwhile, or approve no longer allowed)', async () => {
    vi.mocked(reviewSubmission).mockRejectedValue(new ConflictError());
    expect(await reviewSubmissionAction(approve)).toEqual({
      ok: false,
      error: { code: 'conflict' },
    });
  });

  it('passes on the suggestion the teacher saw, and refuses a malformed one (WS-D-4)', async () => {
    const seen = { ...approve, aiReviewId: 'q4XChK972fSu4wO56qhE' };
    expect((await reviewSubmissionAction(seen)).ok).toBe(true);
    expect(reviewSubmission).toHaveBeenCalledWith(sessionOf('teacher', 'teacher-1'), seen);
    vi.mocked(reviewSubmission).mockClear();
    expect(await reviewSubmissionAction({ ...approve, aiReviewId: '../x' })).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { aiReviewId: ['invalid'] } },
    });
    expect(reviewSubmission).not.toHaveBeenCalled();
  });
});

describe('regenerateAiReviewAction', () => {
  it.each<Role>(['student', 'teacher', 'platform_admin'])(
    'lets a %s ask and answers null',
    async (role) => {
      signIn(role);
      expect(await regenerateAiReviewAction({ submissionId: ID })).toEqual({
        ok: true,
        data: null,
      });
      expect(regenerateAiReview).toHaveBeenCalledWith(sessionOf(role, `${role}-1`), ID);
    },
  );

  it('refuses a school admin', async () => {
    signIn('school_admin');
    expect(await regenerateAiReviewAction({ submissionId: ID })).toEqual({
      ok: false,
      error: { code: 'forbidden' },
    });
    expect(regenerateAiReview).not.toHaveBeenCalled();
  });

  it('passes the limit conflict through', async () => {
    vi.mocked(regenerateAiReview).mockRejectedValue(new ConflictError());
    expect(await regenerateAiReviewAction({ submissionId: ID })).toEqual({
      ok: false,
      error: { code: 'conflict' },
    });
  });
});
