'use server';

import { runAction } from '@/lib/actions/run-action';
import { deleteAttachmentInputSchema, registerUploadInputSchema } from '@/lib/schemas/submission';
import { deleteAttachment, registerUpload } from '@/lib/services/project-flow';
import type { ActionResult } from '@/types/actions';
import type { FileRef, MediaRef, Role } from '@/types/common';
import type { DeleteAttachmentInput, RegisterUploadInput } from '@/types/inputs';

// Uploads and attachments (ARCHITECTURE.md 5.2, 10.4). The role gate is coarse: project-flow
// builds the storage path from the session, re-checks type, size and quota, and decides who may
// remove an attachment.

const UPLOADERS: readonly Role[] = ['student', 'teacher', 'platform_admin'];

/**
 * The server's half of an upload: `uploadFile()` put the object in Storage, this registers it.
 * The input carries the sanitised name `uploadFile()` returned, unchanged, and never `official`:
 * the server picks the path.
 */
export async function registerUploadAction(
  input: RegisterUploadInput,
): Promise<ActionResult<{ file: FileRef; media: MediaRef | null }>> {
  return runAction(
    registerUploadInputSchema,
    input,
    (data, session) => registerUpload(session, data),
    { roles: UPLOADERS },
  );
}

/** Removes an attachment: the owner while the work waits for a review, a reviewer at any time. */
export async function deleteAttachmentAction(
  input: DeleteAttachmentInput,
): Promise<ActionResult<null>> {
  return runAction(
    deleteAttachmentInputSchema,
    input,
    async ({ submissionId, fileId }, session) => {
      await deleteAttachment(session, submissionId, fileId);
      return null;
    },
    { roles: UPLOADERS },
  );
}
