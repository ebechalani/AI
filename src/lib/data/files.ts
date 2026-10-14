import 'server-only';
import type { DocumentReference } from 'firebase-admin/firestore';
import { assertSystem, isSystem, type Actor } from '@/lib/auth/actor';
import { assertCan, canEditCourse, isPlatformAdmin } from '@/lib/auth/authz';
import { ConflictError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { getAdminDb } from '@/lib/firebase/admin';
import { collections, docIds, utcDayKey } from '@/lib/firebase/collections';
import {
  createdNow,
  fromSnapshot,
  fromSnapshotOrNull,
  serverTimestamp,
  updatedNow,
} from '@/lib/firebase/converters';
import { FILE_ID_PATTERN, UPLOAD_QUOTAS } from '@/lib/limits';
import { COMPOSITE_ID_PATTERN } from '@/lib/schemas/common';
import type { FileKind, FilePurpose, FileRecord, FileRef, MediaRef } from '@/types/common';
import { getCourse } from './courses';
import { assertId, isActorUid, isAlreadyExists, isMissingDocument } from './internal-identity';

/**
 * Built by services/project-flow.registerUpload: the path comes from the session, and the
 * content type and size from the stored object, never from the browser.
 */
export interface NewFile {
  /** The UUID the browser generated before uploading. */
  id: string;
  ownerUid: string;
  schoolId: string | null;
  purpose: FilePurpose;
  kind: FileKind;
  storagePath: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  /** course_media: the course the file belongs to; null for official media without a course. */
  courseId: string | null;
}

function fileDoc(fileId: string): DocumentReference {
  assertId(fileId, FILE_ID_PATTERN);
  return collections.files().doc(fileId);
}

/** One reference per distinct id, in the order given. */
function fileDocs(fileIds: string[]): DocumentReference[] {
  const unique = [...new Set(fileIds)];
  unique.forEach((fileId) => assertId(fileId, FILE_ID_PATTERN));
  return unique.map((fileId) => collections.files().doc(fileId));
}

/** The records in the order of `fileIds`, each id once. NotFoundError when one is missing. */
async function readFiles(fileIds: string[]): Promise<FileRecord[]> {
  const refs = fileDocs(fileIds);
  if (refs.length === 0) return [];
  const snapshots = await getAdminDb().getAll(...refs);
  return snapshots.map((snapshot) => fromSnapshot<FileRecord>(snapshot));
}

export async function registerFile(actor: Actor, input: NewFile): Promise<FileRecord> {
  assertSystem(actor);
  const ref = fileDoc(input.id);
  try {
    await ref.create({
      ownerUid: input.ownerUid,
      schoolId: input.schoolId,
      purpose: input.purpose,
      kind: input.kind,
      storagePath: input.storagePath,
      fileName: input.fileName,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      width: input.width,
      height: input.height,
      courseId: input.courseId,
      submissionId: null,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    if (isAlreadyExists(error)) throw new ConflictError(`files/${input.id} already exists.`);
    throw error;
  }
  return fromSnapshot<FileRecord>(await ref.get());
}

/**
 * Counts one upload of `sizeBytes` against the actor's quota for the current UTC day, unless
 * that would exceed it; then nothing is counted and the caller deletes the object.
 */
export async function checkAndCountUpload(
  actor: Actor,
  sizeBytes: number,
): Promise<{ allowed: boolean }> {
  if (isSystem(actor)) throw new ForbiddenError('An upload quota belongs to a user.');
  if (!Number.isFinite(sizeBytes) || sizeBytes < 0) throw new Error('sizeBytes is not a size.');
  const quota = actor.role === 'student' ? UPLOAD_QUOTAS.student : UPLOAD_QUOTAS.staff;
  const now = new Date();
  const ref = collections.uploadUsage().doc(docIds.uploadUsage(actor.uid, utcDayKey(now)));

  return getAdminDb().runTransaction(async (tx) => {
    const usage = await tx.get(ref);
    const fileCount = Number(usage.get('fileCount') ?? 0) + 1;
    const bytes = Number(usage.get('bytes') ?? 0) + sizeBytes;
    if (fileCount > quota.filesPerDay || bytes > quota.bytesPerDay) return { allowed: false };

    if (usage.exists) {
      tx.update(ref, { fileCount, bytes, ...updatedNow() });
    } else {
      tx.create(ref, {
        uid: actor.uid,
        date: now.toISOString().slice(0, 10),
        fileCount,
        bytes,
        ...createdNow(),
      });
    }
    return { allowed: true };
  });
}

/**
 * For the owner and platform admins. Whoever else may download a file (a reviewing teacher,
 * a learner of the course) is decided by the service or route that loads it as the system.
 */
export async function getFile(actor: Actor, fileId: string): Promise<FileRecord> {
  const file = fromSnapshotOrNull<FileRecord>(await fileDoc(fileId).get());
  if (file === null || !(isPlatformAdmin(actor) || isActorUid(actor, file.ownerUid))) {
    throw new NotFoundError(`files/${fileId} does not exist.`);
  }
  return file;
}

/** In the order of `fileIds`. A file of someone else is reported as missing. */
export async function getOwnFiles(actor: Actor, fileIds: string[]): Promise<FileRecord[]> {
  const files = await readFiles(fileIds);
  for (const file of files) {
    if (!isSystem(actor) && file.ownerUid !== actor.uid) {
      throw new NotFoundError(`files/${file.id} does not exist.`);
    }
  }
  return files;
}

/** In the order of `fileIds`. Every file must be registered as media of that course. */
export async function getCourseMediaFiles(
  actor: Actor,
  courseId: string,
  fileIds: string[],
): Promise<FileRecord[]> {
  const course = await getCourse(actor, courseId);
  assertCan(canEditCourse(actor, course), 'course.edit');
  const files = await readFiles(fileIds);
  for (const file of files) {
    if (file.purpose !== 'course_media' || file.courseId !== course.id) {
      throw new NotFoundError(`files/${file.id} is not media of courses/${course.id}.`);
    }
  }
  return files;
}

export async function attachFilesToSubmission(
  actor: Actor,
  fileIds: string[],
  submissionId: string,
): Promise<void> {
  assertSystem(actor);
  assertId(submissionId, COMPOSITE_ID_PATTERN);
  const refs = fileDocs(fileIds);
  if (refs.length === 0) return;
  const batch = getAdminDb().batch();
  for (const ref of refs) batch.update(ref, { submissionId });
  try {
    await batch.commit();
  } catch (error) {
    if (isMissingDocument(error)) throw new NotFoundError('A file to attach does not exist.');
    throw error;
  }
}

/** The record only; the stored object is deleted by the caller. Succeeds when already gone. */
export async function deleteFile(actor: Actor, fileId: string): Promise<void> {
  assertSystem(actor);
  await fileDoc(fileId).delete();
}

export function toFileRef(file: FileRecord): FileRef {
  return {
    fileId: file.id,
    kind: file.kind,
    fileName: file.fileName,
    contentType: file.contentType,
    sizeBytes: file.sizeBytes,
  };
}

export function toMediaRef(file: FileRecord): MediaRef {
  return {
    fileId: file.id,
    storagePath: file.storagePath,
    fileName: file.fileName,
    contentType: file.contentType,
    sizeBytes: file.sizeBytes,
    width: file.width,
    height: file.height,
  };
}
