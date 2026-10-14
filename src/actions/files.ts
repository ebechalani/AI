'use server';

// Stubs (F8): the signatures and roles of ARCHITECTURE.md 10.4; WS-D fills them in.

import { runAction } from '@/lib/actions/run-action';
import { AppError } from '@/lib/errors';
import { deleteAttachmentInputSchema, registerUploadInputSchema } from '@/lib/schemas/submission';
import type { ActionResult } from '@/types/actions';
import type { FileRef, MediaRef, Role } from '@/types/common';
import type { DeleteAttachmentInput, RegisterUploadInput } from '@/types/inputs';

const UPLOADERS: readonly Role[] = ['student', 'teacher', 'platform_admin'];

async function notImplemented(): Promise<never> {
  throw new AppError('not_implemented');
}

export async function registerUploadAction(
  input: RegisterUploadInput,
): Promise<ActionResult<{ file: FileRef; media: MediaRef | null }>> {
  return runAction(registerUploadInputSchema, input, notImplemented, { roles: UPLOADERS });
}

export async function deleteAttachmentAction(
  input: DeleteAttachmentInput,
): Promise<ActionResult<null>> {
  return runAction(deleteAttachmentInputSchema, input, notImplemented, { roles: UPLOADERS });
}
