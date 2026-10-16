import { beforeEach, describe, expect, it, vi } from 'vitest';
import { after } from 'next/server';
import { submitWorkAction } from '@/actions/projects';
import { assertSessionNotRevoked, getSession } from '@/lib/actions/session-source';
import { ConflictError, ValidationError } from '@/lib/errors';
import { generateAiReview, submitWork } from '@/lib/services/project-flow';
import type { Role, SubmitWorkInput } from '@/types';
import { session as sessionOf, submission } from './services-fixtures';

// submitWorkAction (ARCHITECTURE.md 10.4, 9.4): students only, the locale of the page (never
// the payload's), and the AI review scheduled after the response, once the work is stored.

vi.mock('next-intl/server', () => ({ getLocale: vi.fn(() => Promise.resolve('en')) }));
vi.mock('next/server', () => ({ after: vi.fn() }));
vi.mock('@/lib/actions/session-source', () => ({
  getSession: vi.fn(),
  assertSessionNotRevoked: vi.fn(),
}));
vi.mock('@/lib/services/project-flow', () => ({
  submitWork: vi.fn(),
  generateAiReview: vi.fn(),
}));

const NEW_ID = 'student-1_p_course-1_p1_1';

const input: SubmitWorkInput = {
  target: { context: 'project', courseId: 'course-1', projectId: 'p1' },
  title: '  My story  ',
  description: '',
  type: 'text',
  content: { text: 'Once upon a time', linkUrl: null, code: null, codeLanguage: null },
  fileIds: [],
  previousSubmissionId: null,
};

function signIn(role: Role | null): void {
  vi.mocked(getSession).mockResolvedValue(role === null ? null : sessionOf(role, `${role}-1`));
}

beforeEach(() => {
  vi.mocked(submitWork)
    .mockReset()
    .mockResolvedValue(submission({ id: NEW_ID }));
  vi.mocked(generateAiReview).mockReset().mockResolvedValue(undefined);
  vi.mocked(after).mockReset();
  vi.mocked(getSession).mockReset();
  vi.mocked(assertSessionNotRevoked).mockReset().mockResolvedValue(undefined);
  signIn('student');
});

describe('submitWorkAction', () => {
  it('stores the trimmed work with the page’s locale, never the payload’s', async () => {
    const result = await submitWorkAction({ ...input, locale: 'fr' } as SubmitWorkInput);

    expect(result).toEqual({ ok: true, data: { submissionId: NEW_ID } });
    expect(submitWork).toHaveBeenCalledTimes(1);
    const [actor, data] = vi.mocked(submitWork).mock.calls[0]!;
    expect(actor).toEqual(sessionOf('student', 'student-1'));
    expect(data).toEqual({ ...input, title: 'My story', locale: 'en' });
  });

  it('schedules the AI review after the response, once', async () => {
    await submitWorkAction(input);

    expect(after).toHaveBeenCalledTimes(1);
    expect(generateAiReview).not.toHaveBeenCalled();
    const callback = vi.mocked(after).mock.calls[0]![0] as () => unknown;
    await callback();
    expect(generateAiReview).toHaveBeenCalledWith(NEW_ID);
  });

  it.each<Role>(['teacher', 'school_admin', 'platform_admin'])(
    'refuses a %s and schedules nothing',
    async (role) => {
      signIn(role);
      expect(await submitWorkAction(input)).toEqual({ ok: false, error: { code: 'forbidden' } });
      expect(submitWork).not.toHaveBeenCalled();
      expect(after).not.toHaveBeenCalled();
    },
  );

  it('refuses blank text for a text submission before any call', async () => {
    const result = await submitWorkAction({
      ...input,
      content: { ...input.content, text: '   ' },
    });
    expect(result).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { 'content.text': ['content_required'] } },
    });
    expect(submitWork).not.toHaveBeenCalled();
  });

  it('answers a conflict and schedules no review', async () => {
    vi.mocked(submitWork).mockRejectedValue(new ConflictError());
    expect(await submitWorkAction(input)).toEqual({ ok: false, error: { code: 'conflict' } });
    expect(after).not.toHaveBeenCalled();
  });

  it('passes the service’s field errors through', async () => {
    vi.mocked(submitWork).mockRejectedValue(
      new ValidationError('type', { type: ['invalid_choice'] }),
    );
    expect(await submitWorkAction(input)).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { type: ['invalid_choice'] } },
    });
  });

  it('answers unauthenticated without a session', async () => {
    signIn(null);
    expect(await submitWorkAction(input)).toEqual({
      ok: false,
      error: { code: 'unauthenticated' },
    });
  });
});
