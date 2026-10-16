import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/files/[fileId]/route';
import { getSession } from '@/lib/auth/session';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import { serveFile } from '@/lib/firebase/storage-admin';
import { getFileForDownload } from '@/lib/services/project-flow';
import type { FileKind } from '@/types';
import { FILE_ID, fileRecord, session as sessionOf } from './services-fixtures';

// GET /api/files/[fileId] (ARCHITECTURE.md 6.9): every refusal is the same 404 as a missing
// file, with the no-store headers; project-flow.getFileForDownload decides who may read.

vi.mock('@/lib/auth/session', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/services/project-flow', () => ({ getFileForDownload: vi.fn() }));
vi.mock('@/lib/firebase/storage-admin', () => ({ serveFile: vi.fn() }));

const served = new Response('x', { status: 200 });

function call(id: string, query = ''): Promise<Response> {
  return GET(new Request(`http://localhost/api/files/${id}${query}`), {
    params: Promise.resolve({ fileId: id }),
  });
}

function expectNotFound(response: Response): void {
  expect(response.status).toBe(404);
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
}

const owner = sessionOf('student', 'student-1');

beforeEach(() => {
  vi.mocked(getSession).mockReset().mockResolvedValue(owner);
  vi.mocked(getFileForDownload)
    .mockReset()
    .mockResolvedValue(fileRecord({ id: FILE_ID }));
  vi.mocked(serveFile).mockReset().mockResolvedValue(served);
});

describe('GET /api/files/[fileId]', () => {
  it.each(['abc', '../x', `${FILE_ID}x`])(
    'answers 404 for the malformed id %s, before any read',
    async (id) => {
      expectNotFound(await call(id));
      expect(getSession).not.toHaveBeenCalled();
      expect(getFileForDownload).not.toHaveBeenCalled();
    },
  );

  it('answers 404 without a session, and reads nothing', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    expectNotFound(await call(FILE_ID));
    expect(getFileForDownload).not.toHaveBeenCalled();
  });

  it('serves an allowed file from its stored path and answers what serveFile answered', async () => {
    const response = await call(FILE_ID);
    expect(response).toBe(served);
    expect(getFileForDownload).toHaveBeenCalledWith(owner, FILE_ID);
    expect(serveFile).toHaveBeenCalledWith(`user-uploads/student-1/image/${FILE_ID}/photo.png`, {
      inline: true,
    });
  });

  it.each<[FileKind, boolean]>([
    ['image', true],
    ['audio', true],
    ['video', true],
    ['pdf', true],
    ['file', false],
  ])('shows a %s inline: %s', async (kind, inline) => {
    vi.mocked(getFileForDownload).mockResolvedValue(fileRecord({ id: FILE_ID, kind }));
    await call(FILE_ID);
    expect(serveFile).toHaveBeenCalledWith(expect.any(String), { inline });
  });

  it.each<FileKind>(['image', 'audio', 'video', 'pdf', 'file'])(
    'downloads a %s with download=1, also next to an ignored submission hint',
    async (kind) => {
      vi.mocked(getFileForDownload).mockResolvedValue(fileRecord({ id: FILE_ID, kind }));
      await call(FILE_ID, '?download=1');
      await call(FILE_ID, '?submission=student-1_p_course-1_p1_1&download=1');
      expect(vi.mocked(serveFile).mock.calls.map((args) => args[1])).toEqual([
        { inline: false },
        { inline: false },
      ]);
    },
  );

  it('never lets the query change who may read: the hint is not passed on', async () => {
    await call(FILE_ID, '?submission=someone-else_p_c_p_1');
    expect(getFileForDownload).toHaveBeenCalledWith(owner, FILE_ID);
  });

  it.each([
    ['NotFoundError', new NotFoundError()],
    ['ForbiddenError', new ForbiddenError()],
  ])('answers 404 when getFileForDownload throws %s', async (_name, error) => {
    vi.mocked(getFileForDownload).mockRejectedValue(error);
    expectNotFound(await call(FILE_ID));
    expect(serveFile).not.toHaveBeenCalled();
  });

  it('answers 404 when the object is missing from Storage', async () => {
    vi.mocked(serveFile).mockRejectedValue(new NotFoundError());
    expectNotFound(await call(FILE_ID));
  });

  it('lets a real fault through (Next answers 500)', async () => {
    vi.mocked(getFileForDownload).mockRejectedValue(new Error('boom'));
    await expect(call(FILE_ID)).rejects.toThrow('boom');
  });
});
