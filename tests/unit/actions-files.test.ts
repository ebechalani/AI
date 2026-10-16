import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteAttachmentAction, registerUploadAction } from '@/actions/files';
import { assertSessionNotRevoked, getSession } from '@/lib/actions/session-source';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from '@/lib/errors';
import { deleteAttachment, registerUpload } from '@/lib/services/project-flow';
import type { FileRef, RegisterUploadInput, Role } from '@/types';
import { FILE_ID, session as sessionOf } from './services-fixtures';

// The upload actions of WS-D (ARCHITECTURE.md 10.4, 5.2): the roles they let through, what
// they hand to project-flow, and that the service's codes reach the client unchanged.

vi.mock('next-intl/server', () => ({ getLocale: vi.fn(() => Promise.resolve('en')) }));
vi.mock('@/lib/actions/session-source', () => ({
  getSession: vi.fn(),
  assertSessionNotRevoked: vi.fn(),
}));
vi.mock('@/lib/services/project-flow', () => ({
  registerUpload: vi.fn(),
  deleteAttachment: vi.fn(),
}));

const SUBMISSION_ID = 'stu-1_p_course-1_p1_1';

const input: RegisterUploadInput = {
  purpose: 'submission',
  fileId: FILE_ID,
  kind: 'image',
  fileName: 'page-1.png',
  width: 640,
  height: 480,
};

const file: FileRef = {
  fileId: FILE_ID,
  kind: 'image',
  fileName: 'page-1.png',
  contentType: 'image/png',
  sizeBytes: 1234,
};

function signIn(role: Role | null): void {
  vi.mocked(getSession).mockResolvedValue(role === null ? null : sessionOf(role, `${role}-1`));
}

beforeEach(() => {
  vi.mocked(registerUpload).mockReset().mockResolvedValue({ file, media: null });
  vi.mocked(deleteAttachment).mockReset().mockResolvedValue(undefined);
  vi.mocked(getSession).mockReset();
  vi.mocked(assertSessionNotRevoked).mockReset().mockResolvedValue(undefined);
  signIn('student');
});

describe('registerUploadAction', () => {
  it.each<Role>(['student', 'teacher', 'platform_admin'])(
    'lets a %s register and hands the parsed input to the service',
    async (role) => {
      signIn(role);
      const result = await registerUploadAction(input);
      expect(result).toEqual({ ok: true, data: { file, media: null } });
      expect(registerUpload).toHaveBeenCalledWith(sessionOf(role, `${role}-1`), input);
    },
  );

  it('refuses a school admin without calling the service', async () => {
    signIn('school_admin');
    expect(await registerUploadAction(input)).toEqual({ ok: false, error: { code: 'forbidden' } });
    expect(registerUpload).not.toHaveBeenCalled();
  });

  it('answers unauthenticated without a session', async () => {
    signIn(null);
    expect(await registerUploadAction(input)).toEqual({
      ok: false,
      error: { code: 'unauthenticated' },
    });
    expect(registerUpload).not.toHaveBeenCalled();
  });

  it('checks staff sessions against revocation, not students’', async () => {
    await registerUploadAction(input);
    expect(assertSessionNotRevoked).not.toHaveBeenCalled();
    signIn('teacher');
    await registerUploadAction(input);
    expect(assertSessionNotRevoked).toHaveBeenCalledTimes(1);
  });

  it('keeps the course id of course media and drops an `official` field', async () => {
    signIn('teacher');
    await registerUploadAction({
      ...input,
      purpose: 'course_media',
      courseId: 'course-1',
      official: true,
    } as RegisterUploadInput);
    expect(registerUpload).toHaveBeenCalledWith(
      sessionOf('teacher', 'teacher-1'),
      expect.not.objectContaining({ official: true }),
    );
    expect(vi.mocked(registerUpload).mock.calls[0]?.[1]).toMatchObject({ courseId: 'course-1' });
  });

  it.each([
    ['a dot-only file name', { fileName: '..' }, 'fileName'],
    ['a file id that is not a UUID', { fileId: 'abc' }, 'fileId'],
  ])('refuses %s before any call', async (_label, change, path) => {
    const result = await registerUploadAction({ ...input, ...change });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('validation');
    expect(result.error.fieldErrors?.[path]).toBeDefined();
    expect(registerUpload).not.toHaveBeenCalled();
  });

  it('answers the daily quota as rate_limited without a retry delay', async () => {
    vi.mocked(registerUpload).mockRejectedValue(new RateLimitError(null));
    expect(await registerUploadAction(input)).toEqual({
      ok: false,
      error: { code: 'rate_limited' },
    });
  });

  it('passes the service’s file errors through', async () => {
    vi.mocked(registerUpload).mockRejectedValue(
      new ValidationError('too big', { file: ['file_too_large'] }),
    );
    expect(await registerUploadAction(input)).toEqual({
      ok: false,
      error: { code: 'validation', fieldErrors: { file: ['file_too_large'] } },
    });
  });

  it.each([
    [new NotFoundError(), 'not_found'],
    [new ConflictError(), 'conflict'],
    [new ForbiddenError(), 'forbidden'],
  ])('maps %s to its code', async (error, code) => {
    vi.mocked(registerUpload).mockRejectedValue(error);
    expect(await registerUploadAction(input)).toEqual({ ok: false, error: { code } });
  });
});

describe('deleteAttachmentAction', () => {
  const remove = { submissionId: SUBMISSION_ID, fileId: FILE_ID };

  it('deletes through the service and answers null', async () => {
    expect(await deleteAttachmentAction(remove)).toEqual({ ok: true, data: null });
    expect(deleteAttachment).toHaveBeenCalledWith(
      sessionOf('student', 'student-1'),
      SUBMISSION_ID,
      FILE_ID,
    );
  });

  it('passes a refusal of the service through', async () => {
    vi.mocked(deleteAttachment).mockRejectedValue(new ForbiddenError());
    expect(await deleteAttachmentAction(remove)).toEqual({
      ok: false,
      error: { code: 'forbidden' },
    });
  });

  it('refuses a school admin without calling the service', async () => {
    signIn('school_admin');
    expect(await deleteAttachmentAction(remove)).toEqual({
      ok: false,
      error: { code: 'forbidden' },
    });
    expect(deleteAttachment).not.toHaveBeenCalled();
  });

  it('refuses a malformed submission id before any call', async () => {
    const result = await deleteAttachmentAction({ submissionId: '../x', fileId: FILE_ID });
    expect(result.ok).toBe(false);
    expect(deleteAttachment).not.toHaveBeenCalled();
  });
});
