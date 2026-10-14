// Shared by the browser (upload checks, media URLs) and the server (path building, upload
// registration). storage.rules repeats the same limits; the three must change together.

import { getPublicEnv } from '@/lib/env';
import { FILE_ID_PATTERN, FILE_NAME_PATTERN } from '@/lib/limits';
import { ID_PATTERN } from '@/lib/schemas/common';
import { FILE_KINDS, type FileKind, type MediaRef } from '@/types/common';

export { FILE_ID_PATTERN, FILE_NAME_PATTERN };

const MB = 1024 * 1024;

const OCTET_STREAM = 'application/octet-stream';
const OFFICE = 'application/vnd.openxmlformats-officedocument';

// Extension → the content type an upload of that kind is stored with. Browsers disagree on the
// type of the same file (a .zip is 'application/x-zip-compressed' on Windows, a .ipynb has
// none), so the extension decides whenever it is a known one.
const TYPES_BY_EXTENSION: Record<FileKind, Record<string, string>> = {
  image: {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  },
  audio: {
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
    '.mp4': 'audio/mp4',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.oga': 'audio/ogg',
    '.webm': 'audio/webm',
  },
  video: {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
  },
  pdf: { '.pdf': 'application/pdf' },
  file: {
    '.zip': 'application/zip',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.docx': `${OFFICE}.wordprocessingml.document`,
    '.pptx': `${OFFICE}.presentationml.presentation`,
    '.xlsx': `${OFFICE}.spreadsheetml.sheet`,
    '.sb3': 'application/x.scratch.sb3',
    '.ipynb': OCTET_STREAM,
  },
};

const MAX_BYTES: Record<FileKind, number> = {
  image: 10 * MB,
  audio: 25 * MB,
  video: 100 * MB,
  pdf: 20 * MB,
  file: 25 * MB,
};

/** The one generic type, accepted for kind 'file' and only under these extensions. */
export const OCTET_STREAM_EXTENSIONS: readonly string[] = ['.sb3', '.ipynb'];

function limitsOf(kind: FileKind) {
  const types = TYPES_BY_EXTENSION[kind];
  return {
    maxBytes: MAX_BYTES[kind],
    contentTypes: [...new Set(Object.values(types))].filter((type) => type !== OCTET_STREAM),
    extensions: Object.keys(types),
  };
}

/**
 * `extensions` carry their dot and are lower-case, ready for an `accept` attribute.
 * `contentTypes` leaves out 'application/octet-stream', which is allowed only together with
 * an extension of OCTET_STREAM_EXTENSIONS: decide with checkUpload(), not with includes().
 */
export const UPLOAD_LIMITS: Record<
  FileKind,
  { maxBytes: number; contentTypes: string[]; extensions: string[] }
> = {
  image: limitsOf('image'),
  audio: limitsOf('audio'),
  video: limitsOf('video'),
  pdf: limitsOf('pdf'),
  file: limitsOf('file'),
};

function extensionOf(fileName: string): string {
  return /\.[A-Za-z0-9]+$/.exec(fileName)?.[0].toLowerCase() ?? '';
}

// 'text/plain; charset=utf-8' → 'text/plain'
function bareType(contentType: string): string {
  return contentType.split(';')[0].trim().toLowerCase();
}

export function isAllowedContentType(
  kind: FileKind,
  contentType: string,
  fileName: string,
): boolean {
  const type = bareType(contentType);
  if (type === OCTET_STREAM) {
    return kind === 'file' && OCTET_STREAM_EXTENSIONS.includes(extensionOf(fileName));
  }
  return UPLOAD_LIMITS[kind].contentTypes.includes(type);
}

/** Keys of the `validation` message namespace. */
export type UploadProblem = 'file_type_not_allowed' | 'file_too_large';

/** The rule of ARCHITECTURE.md 5.2, for the browser before an upload and the server after it. */
export function checkUpload(
  kind: FileKind,
  object: { contentType: string; sizeBytes: number; fileName: string },
): UploadProblem | null {
  if (!isAllowedContentType(kind, object.contentType, object.fileName)) {
    return 'file_type_not_allowed';
  }
  return object.sizeBytes > UPLOAD_LIMITS[kind].maxBytes ? 'file_too_large' : null;
}

/**
 * The content type to upload a file with: the one its extension stands for in that kind,
 * else the type the browser declared when that is an allowed one, else null (not allowed).
 */
export function uploadContentType(
  kind: FileKind,
  fileName: string,
  declaredType: string,
): string | null {
  const byExtension = TYPES_BY_EXTENSION[kind][extensionOf(fileName)];
  if (byExtension !== undefined) return byExtension;
  const declared = bareType(declaredType);
  return isAllowedContentType(kind, declared, fileName) ? declared : null;
}

// --- Paths -------------------------------------------------------------------------------------

const OFFICIAL_MEDIA_PREFIX = 'course-media/official/';

// Every caller validates these with zod first. The check is repeated because a path segment
// that is '..' or contains a slash would address another user's folder.
function segment(value: string, pattern: RegExp, what: string): string {
  if (!pattern.test(value) || /^\.+$/.test(value)) {
    throw new Error(`Invalid ${what} in a storage path.`);
  }
  return value;
}

function fileSegments(fileId: string, fileName: string): string {
  return `${segment(fileId, FILE_ID_PATTERN, 'file id')}/${segment(fileName, FILE_NAME_PATTERN, 'file name')}`;
}

/** Learner work: never readable from the client, served through /api/files. */
export function userUploadPath(
  uid: string,
  kind: FileKind,
  fileId: string,
  fileName: string,
): string {
  if (!FILE_KINDS.includes(kind)) throw new Error('Invalid file kind in a storage path.');
  return `user-uploads/${segment(uid, ID_PATTERN, 'uid')}/${kind}/${fileSegments(fileId, fileName)}`;
}

/** Media of a teacher-made course: as private as the course, served through /api/files. */
export function authorMediaPath(uid: string, fileId: string, fileName: string): string {
  return `course-media/authors/${segment(uid, ID_PATTERN, 'uid')}/${fileSegments(fileId, fileName)}`;
}

/** Media of official courses and challenges: publicly readable. */
export function officialMediaPath(fileId: string, fileName: string): string {
  return `${OFFICIAL_MEDIA_PREFIX}${fileSegments(fileId, fileName)}`;
}

export function isPublicMediaPath(storagePath: string): boolean {
  return storagePath.startsWith(OFFICIAL_MEDIA_PREFIX);
}

/** Where the browser reaches the Storage emulator: the port of firebase.json. */
export const STORAGE_EMULATOR_ORIGIN = 'http://127.0.0.1:9199';
const STORAGE_ORIGIN = 'https://firebasestorage.googleapis.com';

/**
 * The URL a browser loads the media from: the public Storage URL for official media, the
 * authorizing route handler for everything else (and for official media while the web config
 * is not set, since the bucket name comes from it). Same result on the server and in the
 * browser, so it is safe to call while rendering.
 */
export function mediaUrl(media: Pick<MediaRef, 'fileId' | 'storagePath'>): string {
  if (isPublicMediaPath(media.storagePath)) {
    const { firebase, useEmulators } = getPublicEnv();
    if (firebase !== null) {
      const origin = useEmulators ? STORAGE_EMULATOR_ORIGIN : STORAGE_ORIGIN;
      const object = encodeURIComponent(media.storagePath);
      return `${origin}/v0/b/${firebase.storageBucket}/o/${object}?alt=media`;
    }
  }
  return `/api/files/${media.fileId}`;
}

const MAX_FILE_NAME_CHARS = 100;

/**
 * Turns the name of a local file into one that FILE_NAME_PATTERN (and the Storage rules)
 * accept: ASCII letters, digits, dot, dash and underscore, at most 100 characters, with the
 * extension kept and lower-cased. A name with nothing usable in it becomes 'file'.
 */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  const extension = /\.[A-Za-z0-9]{1,15}$/.exec(base)?.[0].toLowerCase() ?? '';
  const stem = base
    .slice(0, base.length - extension.length)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/-*\.-*/g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, MAX_FILE_NAME_CHARS - extension.length)
    .replace(/[-.]+$/, '');
  return `${stem || 'file'}${extension}`;
}
