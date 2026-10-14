// Browser only: the direct upload to Cloud Storage. The server's half of an upload is
// registerUploadAction, which the caller invokes with the result.

import { FirebaseError } from 'firebase/app';
import { ref, uploadBytesResumable } from 'firebase/storage';
import { ensureClientAuth } from '@/lib/auth/client';
import { AppError, ForbiddenError, UnauthenticatedError, ValidationError } from '@/lib/errors';
import { CONTENT_LIMITS } from '@/lib/limits';
import type { FileKind } from '@/types/common';
import { getClientAuth, getClientStorage } from './client';
import {
  authorMediaPath,
  checkUpload,
  officialMediaPath,
  sanitizeFileName,
  uploadContentType,
  userUploadPath,
  type UploadProblem,
} from './storage-paths';

type UploadTarget =
  | { purpose: 'submission' }
  /** `official`: the course is official, or the media has no course (`courseId` null). */
  | { purpose: 'course_media'; courseId: string | null; official: boolean };

export type UploadFileArgs = {
  file: File;
  kind: FileKind;
  /** 0–100, called as the bytes go out. */
  onProgress?: (percent: number) => void;
} & UploadTarget;

export interface UploadedFile {
  fileId: string;
  /** The sanitised name the object was stored under; pass it to registerUploadAction as is. */
  fileName: string;
  /** Images only, as display hints. */
  width: number | null;
  height: number | null;
}

async function measureImage(file: File): Promise<Pick<UploadedFile, 'width' | 'height'>> {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    bitmap.close();
    const max = CONTENT_LIMITS.imagePixelsMax;
    if (width >= 1 && height >= 1 && width <= max && height <= max) return { width, height };
  } catch {
    // The upload does not depend on the hint; a file that is no image fails registration.
  }
  return { width: null, height: null };
}

function refused(problem: UploadProblem): ValidationError {
  return new ValidationError(problem, { file: [problem] });
}

function storageCode(error: unknown): string {
  return error instanceof FirebaseError ? error.code : '';
}

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const code = storageCode(error);
  if (code === 'storage/unauthorized') return new ForbiddenError(code);
  if (code === 'storage/unauthenticated') return new UnauthenticatedError(code);
  return new AppError('internal', code || (error instanceof Error ? error.message : undefined));
}

function put(
  path: string,
  file: File,
  contentType: string,
  onProgress: UploadFileArgs['onProgress'],
): Promise<void> {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(ref(getClientStorage(), path), file, { contentType });
    task.on(
      'state_changed',
      ({ bytesTransferred, totalBytes }) => {
        onProgress?.(totalBytes > 0 ? Math.round((bytesTransferred / totalBytes) * 100) : 0);
      },
      reject,
      () => resolve(),
    );
  });
}

/**
 * Uploads one file to the caller's own folder (or, for a platform admin, the official media
 * folder) under a new file id. The name is sanitised and the type and size are checked here
 * first, for a quick answer; the Storage rules and registerUpload check them again.
 *
 * Fails with an AppError: `validation` with `fieldErrors.file` (`file_type_not_allowed` or
 * `file_too_large`), `unauthenticated` when the server session is gone (send the user to
 * /login), `forbidden` when Storage refuses the upload even after signing in again,
 * `internal` otherwise.
 */
export async function uploadFile(args: UploadFileArgs): Promise<UploadedFile> {
  const { file, kind, onProgress } = args;
  const fileName = sanitizeFileName(file.name);
  const contentType = uploadContentType(kind, fileName, file.type);
  if (contentType === null) throw refused('file_type_not_allowed');
  const problem = checkUpload(kind, { contentType, sizeBytes: file.size, fileName });
  if (problem !== null) throw refused(problem);

  const fileId = crypto.randomUUID();
  const send = async () => {
    const uid = getClientAuth().currentUser?.uid;
    if (uid === undefined) throw new UnauthenticatedError('No client user after signing in.');
    const path =
      args.purpose === 'submission'
        ? userUploadPath(uid, kind, fileId, fileName)
        : args.official
          ? officialMediaPath(fileId, fileName)
          : authorMediaPath(uid, fileId, fileName);
    await put(path, file, contentType, onProgress);
  };

  try {
    const [dimensions] = await Promise.all([
      kind === 'image' ? measureImage(file) : { width: null, height: null },
      ensureClientAuth(),
    ]);
    try {
      await send();
    } catch (error) {
      // The client's token can be stale while the server session is fine (tokens revoked by a
      // sign-out on another device and a new login since): sign in again once, then give up.
      const code = storageCode(error);
      if (code !== 'storage/unauthorized' && code !== 'storage/unauthenticated') throw error;
      await ensureClientAuth({ force: true });
      await send();
    }
    return { fileId, fileName, ...dimensions };
  } catch (error) {
    throw toAppError(error);
  }
}
