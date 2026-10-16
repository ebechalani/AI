// FileUpload's rules (SPEC-D 5.1, 5.2): which kind a chosen file is, what the picker accepts,
// the quick check before any network call, the two calls' arguments, and how a failure is
// shown. Pure, for the unit tests.

import { isAppError, ValidationError } from '@/lib/errors';
import {
  checkUpload,
  sanitizeFileName,
  UPLOAD_LIMITS,
  uploadContentType,
  type UploadProblem,
} from '@/lib/firebase/storage-paths';
import type { UploadFileArgs } from '@/lib/firebase/upload-client';
import { isValidationKey } from '@/lib/schemas/common';
import type { ActionError } from '@/types/actions';
import type { FileKind } from '@/types/common';
import type { RegisterUploadInput } from '@/types/inputs';

/**
 * The first of `kinds` that takes the file, by its extension or its declared type. The order
 * decides an ambiguous extension: '.mp4' is audio when audio comes first.
 */
export function pickKind(
  kinds: readonly FileKind[],
  file: { name: string; type: string },
): FileKind | null {
  const fileName = sanitizeFileName(file.name);
  return kinds.find((kind) => uploadContentType(kind, fileName, file.type) !== null) ?? null;
}

/** The picker's `accept`: every extension, then every content type, of the kinds. */
export function acceptAttribute(kinds: readonly FileKind[]): string {
  const extensions = new Set(kinds.flatMap((kind) => UPLOAD_LIMITS[kind].extensions));
  const types = new Set(kinds.flatMap((kind) => UPLOAD_LIMITS[kind].contentTypes));
  return [...extensions, ...types].join(',');
}

export interface KindLimit {
  kind: FileKind;
  /** Upper-case extensions without the dot: "PNG", "JPG". */
  types: string[];
  maxBytes: number;
}

/** One line of the hint under the button per kind. */
export function kindLimits(kinds: readonly FileKind[]): KindLimit[] {
  return kinds.map((kind) => ({
    kind,
    types: [...new Set(UPLOAD_LIMITS[kind].extensions.map((ext) => ext.slice(1).toUpperCase()))],
    maxBytes: UPLOAD_LIMITS[kind].maxBytes,
  }));
}

/** The browser's quick check: a refusal here costs no network call. */
export function precheck(
  kinds: readonly FileKind[],
  file: { name: string; type: string; size: number },
): { kind: FileKind } | { problem: UploadProblem } {
  const kind = pickKind(kinds, file);
  if (kind === null) return { problem: 'file_type_not_allowed' };
  const fileName = sanitizeFileName(file.name);
  const contentType = uploadContentType(kind, fileName, file.type) ?? '';
  const problem = checkUpload(kind, { contentType, sizeBytes: file.size, fileName });
  return problem === null ? { kind } : { problem };
}

export type UploadTarget =
  | { purpose: 'submission' }
  | { purpose: 'course_media'; courseId: string | null; official: boolean };

export function uploadArgs(
  target: UploadTarget,
  file: File,
  kind: FileKind,
  onProgress: (percent: number) => void,
): UploadFileArgs {
  return target.purpose === 'submission'
    ? { purpose: 'submission', file, kind, onProgress }
    : {
        purpose: 'course_media',
        courseId: target.courseId,
        official: target.official,
        file,
        kind,
        onProgress,
      };
}

/**
 * registerUploadAction's input: the name exactly as uploadFile() stored it, and no `official`
 * (the server decides the path from the session and the course).
 */
export function registerInput(
  target: UploadTarget,
  kind: FileKind,
  uploaded: { fileId: string; fileName: string; width: number | null; height: number | null },
): RegisterUploadInput {
  const common = {
    fileId: uploaded.fileId,
    kind,
    fileName: uploaded.fileName,
    width: uploaded.width,
    height: uploaded.height,
  };
  return target.purpose === 'submission'
    ? { purpose: 'submission', ...common }
    : { purpose: 'course_media', courseId: target.courseId, ...common };
}

/** What uploadFile() threw, as an action error. */
export function toActionError(error: unknown): ActionError {
  if (error instanceof ValidationError) {
    return error.fieldErrors === undefined
      ? { code: 'validation' }
      : { code: 'validation', fieldErrors: error.fieldErrors };
  }
  if (isAppError(error)) return { code: error.code };
  return { code: 'internal' };
}

export type UploadErrorView =
  | { kind: 'validation'; key: string }
  | {
      kind: 'projects';
      key:
        | 'upload.errors.refused'
        | 'upload.errors.quota'
        | 'upload.errors.notStored'
        | 'upload.errors.retry';
    }
  | { kind: 'session' }
  | { kind: 'error'; error: ActionError };

/**
 * How a failed upload is explained. `forbidden` while uploading is Storage refusing the object;
 * while registering it is the role (a school admin, course media not allowed).
 */
export function uploadErrorView(error: ActionError, stage: 'upload' | 'register'): UploadErrorView {
  switch (error.code) {
    case 'validation': {
      const fieldErrors = error.fieldErrors ?? {};
      const key =
        fieldErrors.file?.[0] ??
        (fieldErrors.fileName !== undefined ? 'file_name_invalid' : 'invalid');
      return { kind: 'validation', key: isValidationKey(key) ? key : 'invalid' };
    }
    case 'forbidden':
      return stage === 'upload'
        ? { kind: 'projects', key: 'upload.errors.refused' }
        : { kind: 'error', error };
    case 'rate_limited':
      return { kind: 'projects', key: 'upload.errors.quota' };
    case 'not_found':
      return { kind: 'projects', key: 'upload.errors.notStored' };
    case 'conflict':
      return { kind: 'projects', key: 'upload.errors.retry' };
    case 'unauthenticated':
      return { kind: 'session' };
    default:
      return { kind: 'error', error };
  }
}
