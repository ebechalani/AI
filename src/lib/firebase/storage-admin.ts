import 'server-only';
import { Readable } from 'node:stream';
import { getServerEnv } from '@/lib/env';
import { NotFoundError } from '@/lib/errors';
import type { IsoDateString } from '@/types/common';
import { getAdminBucket } from './admin';

/** What Storage itself says about an object, as opposed to what the uploader claimed. */
export interface StoredObject {
  contentType: string;
  sizeBytes: number;
  createdAt: IsoDateString | null;
}

const SIGNED_URL_TTL_MS = 10 * 60 * 1000;

function isNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 404;
}

/** null when there is no object at that path. */
export async function statObject(storagePath: string): Promise<StoredObject | null> {
  try {
    const [metadata] = await getAdminBucket().file(storagePath).getMetadata();
    return {
      contentType: metadata.contentType ?? '',
      sizeBytes: Number(metadata.size ?? 0),
      createdAt: metadata.timeCreated ? new Date(metadata.timeCreated).toISOString() : null,
    };
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

/**
 * Removes the token that the Firebase client SDK and the console attach to an object. Anyone
 * holding a token URL can read the object for ever, past every rule; without the token the
 * only ways to the bytes are the Admin SDK and, for official media, the public rule.
 *
 * The Storage emulator keeps its tokens apart from the object's metadata and ignores this
 * request, so there the token stays; it opens nothing outside the developer's machine.
 */
export async function clearDownloadTokens(storagePath: string): Promise<void> {
  await getAdminBucket()
    .file(storagePath)
    .setMetadata({ metadata: { firebaseStorageDownloadTokens: null } });
}

/** Succeeds when the object is already gone. */
export async function deleteObject(storagePath: string): Promise<void> {
  await getAdminBucket().file(storagePath).delete({ ignoreNotFound: true });
}

/**
 * The response of GET /api/files/[fileId], once the handler has authorized the caller: a
 * redirect to a V4 signed URL that lives ten minutes, or, on the emulator (which has no key to
 * sign with), the object itself. `inline` lets the browser render the file (images, audio,
 * video, PDF); everything else is a download.
 *
 * On a real project the object is not read here, so a path without an object yields a
 * redirect that Storage answers with 404. On the emulator it throws NotFoundError.
 */
export async function serveFile(
  storagePath: string,
  options: { inline: boolean },
): Promise<Response> {
  const file = getAdminBucket().file(storagePath);
  const fileName = storagePath.slice(storagePath.lastIndexOf('/') + 1).replace(/[^\w.-]/g, '_');
  const disposition = `${options.inline ? 'inline' : 'attachment'}; filename="${fileName}"`;
  const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };

  if (!getServerEnv().isEmulator) {
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + SIGNED_URL_TTL_MS,
      responseDisposition: disposition,
    });
    return new Response(null, { status: 302, headers: { ...headers, Location: url } });
  }

  const object = await statObject(storagePath);
  if (object === null) throw new NotFoundError(`No object at ${storagePath}.`);
  const body = Readable.toWeb(file.createReadStream()) as unknown as ReadableStream<Uint8Array>;
  return new Response(body, {
    headers: {
      ...headers,
      'Content-Type': object.contentType || 'application/octet-stream',
      'Content-Length': String(object.sizeBytes),
      'Content-Disposition': disposition,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
